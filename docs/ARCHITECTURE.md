# Architecture Overview

This document summarizes how DeFooocus starts, prepares the environment, launches the user
interface and processes a generation request.

## Boot and Update

[`entry_with_update.py`](../entry_with_update.py) is the entry point when running the
application. It sets the repository root on the Python path, changes the working
directory and tries to update the local git checkout using `pygit2`. When the
update succeeds (or fails silently) it imports `launch` which continues the
startup process.

## Environment Setup and Model Downloads

Inside [`launch.py`](../launch.py) the function `prepare_environment()` installs
Torch and other Python dependencies if they are missing. It also configures
some environment variables before models are downloaded. Model files are
retrieved via `download_models()` which calls `load_file_from_url()` from
[`modules/model_loader.py`](../modules/model_loader.py). This helper ensures the
target directory exists and downloads missing files using
`torch.hub.download_url_to_file`.

After the environment is ready and required models are present, `launch.py`
imports `webui.py` which builds and starts the UI.

## Gradio UI

[`webui.py`](../webui.py) constructs a `gr.Blocks` interface assigned to
`shared.gradio_root`. This interface includes tabs for generation, Photopea,
rembg and online tools. The application is started by calling
`shared.gradio_root.launch()` with parameters such as the server port and whether
it should be shared publicly.

The `Generate` button is wired to `generate_clicked()`. When pressed, UI values
are collected into an `AsyncTask` and appended to a queue for background
processing.

## Async Processing and Image Generation

`modules/async_worker.py` defines the `AsyncTask` class and spawns a worker
thread. The worker waits for tasks in `async_tasks`, then executes them by
calling functions from [`modules/default_pipeline.py`](../modules/default_pipeline.py).
`process_diffusion()` handles sampling with the selected models and returns the
final images. Progress and results are pushed back to the UI via the task's
`yields` list which `generate_clicked()` consumes to update the interface.
