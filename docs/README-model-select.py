# Models used in the repository

"""
The repository’s presets specify which model files are used.  
For example, the main preset declares “FluentlyXL‑v4.safetensors” as the default model and downloads it from HuggingFace. It also attaches a LoRA file:

{
    "default_model": "FluentlyXL-v4.safetensors",
    "default_refiner": "None",
    "default_refiner_switch": 0.5,
    "default_loras": [
        [
            "sd_xl_offset_example-lora_1.0.safetensors",
            0.1
        ],
        ...
    ],
    ...
    "checkpoint_downloads": {
        "FluentlyXL-v4.safetensors": "https://huggingface.co/fluently/Fluently-XL-v4/resolve/main/FluentlyXL-v4.safetensors"
    },
    "lora_downloads": {
        "sd_xl_offset_example-lora_1.0.safetensors": "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_offset_example-lora_1.0.safetensors"
    }
}

Other presets point to additional models. For example, the SD1.5 preset includes a refiner model:

{
    "default_model": "FluentlyXL-v4.safetensors",
    "default_refiner": "Reliberate_v3.safetensors",
    ...
    "checkpoint_downloads": {
        "FluentlyXL-v4.safetensors": "https://huggingface.co/fluently/Fluently-XL-v4/resolve/main/FluentlyXL-v4.safetensors",
        "Reliberate_v3.safetensors": "https://huggingface.co/XpucT/Reliberate/resolve/main/Reliberate_v3.safetensors"
    }
}

The “lightning” preset uses a different LoRA:

{
    "default_model": "FluentlyXL-v4.safetensors",
    ...
    "default_loras": [
        ["None", 1.0],
        ["sdxl_lightning_4step_lora.safetensors", 1.0],
        ...
    ],
    "checkpoint_downloads": {
        "FluentlyXL-v4.safetensors": "https://huggingface.co/fluently/Fluently-XL-v4/resolve/main/FluentlyXL-v4.safetensors"
    },
    "lora_downloads": {
        "sdxl_lightning_4step_lora.safetensors": "https://huggingface.co/ByteDance/SDXL-Lightning/resolve/main/sdxl_lightning_4step_lora.safetensors"
    }
}

Model files are downloaded by the `download_models` function:

```
def download_models(default_model, previous_default_models, checkpoint_downloads, embeddings_downloads, lora_downloads):
    for file_name, url in vae_approx_filenames:
        load_file_from_url(url=url, model_dir=config.path_vae_approx, file_name=file_name)

    load_file_from_url(
        url='https://huggingface.co/lllyasviel/misc/resolve/main/fooocus_expansion.bin',
        model_dir=config.path_fooocus_expansion,
        file_name='pytorch_model.bin'
    )

    ...
    for file_name, url in checkpoint_downloads.items():
        load_file_from_url(url=url, model_dir=config.path_checkpoints, file_name=file_name)
    for file_name, url in lora_downloads.items():
        load_file_from_url(url=url, model_dir=config.path_loras, file_name=file_name)
```

Once downloaded, models are loaded into memory through `refresh_base_model` or `refresh_refiner_model`, which call `core.load_model`:

```
@torch.no_grad()
@torch.inference_mode()
def refresh_base_model(name):
    global model_base
    filename = os.path.abspath(os.path.realpath(os.path.join(modules.config.path_checkpoints, name)))
    if model_base.filename == filename:
        return
    model_base = core.StableDiffusionModel()
    model_base = core.load_model(filename)
    print(f'Base model loaded: {model_base.filename}')
```

`core.load_model` uses `load_checkpoint_guess_config` from `ldm_patched/modules/sd.py` to parse a checkpoint and return the UNet, VAE, and CLIP components:

```
@torch.no_grad()
@torch.inference_mode()
def load_model(ckpt_filename):
    unet, clip, vae, clip_vision = load_checkpoint_guess_config(ckpt_filename, embedding_directory=path_embeddings)
    return StableDiffusionModel(unet=unet, clip=clip, vae=vae, clip_vision=clip_vision, filename=ckpt_filename)
```

The README also notes the default model:

- Default model is FluentlyXL v4

In summary, DeFooocus relies on several Stable Diffusion–compatible models:

* **FluentlyXL‑v4.safetensors** – the default base model.
* **sd_xl_offset_example‑lora_1.0.safetensors** – a default LoRA used with the base model.
* **Reliberate_v3.safetensors** – a refiner model in the SD1.5 preset.
* **sdxl_lightning_4step_lora.safetensors** – a LoRA for the “lightning” preset.

These models are downloaded through `download_models` in `launch.py` and loaded via `refresh_base_model`/`refresh_refiner_model`, which internally call `core.load_model` that reads each checkpoint using `load_checkpoint_guess_config`. The combination of these functions allows DeFooocus to manage and switch between the various models defined in its presets.
"""
