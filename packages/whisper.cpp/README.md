## 代码

- 0：成功启动处理线程。
- -1：index 超出范围（大于 g_contexts.size()）。
- -2：对应的上下文未初始化（g_contexts[index] == nullptr）。

## 日志

```shell
whisper_init_from_file_with_params_no_state: loading model from 'whisper.bin'
whisper_init_with_params_no_state: use gpu    = 1
whisper_init_with_params_no_state: flash attn = 0
whisper_init_with_params_no_state: gpu_device = 0
whisper_init_with_params_no_state: dtw        = 0
whisper_init_with_params_no_state: devices    = 1
whisper_init_with_params_no_state: backends   = 1
whisper_model_load: loading model
whisper_model_load: n_vocab       = 51865
whisper_model_load: n_audio_ctx   = 1500
whisper_model_load: n_audio_state = 384
whisper_model_load: n_audio_head  = 6
whisper_model_load: n_audio_layer = 4
whisper_model_load: n_text_ctx    = 448
whisper_model_load: n_text_state  = 384
whisper_model_load: n_text_head   = 6
whisper_model_load: n_text_layer  = 4
whisper_model_load: n_mels        = 80
whisper_model_load: ftype         = 1
whisper_model_load: qntvr         = 0
whisper_model_load: type          = 1 (tiny)
whisper_model_load: adding 1608 extra tokens
whisper_model_load: n_langs       = 99
whisper_model_load:          CPU total size =    77.11 MB
whisper_model_load: model size    =   77.11 MB
whisper_backend_init_gpu: no GPU found
whisper_init_state: kv self size  =    3.15 MB
whisper_init_state: kv cross size =    9.44 MB
whisper_init_state: kv pad  size  =    2.36 MB
whisper_init_state: compute buffer (conv)   =   12.78 MB
whisper_init_state: compute buffer (encode) =   64.38 MB
whisper_init_state: compute buffer (cross)  =    3.47 MB
whisper_init_state: compute buffer (decode) =   95.48 MB
js: whisper initialized, instance: 1
 
js: processing - this might take a while ...
 
system_info: n_threads = 8 / 8 | WHISPER : COREML = 0 | OPENVINO = 0 | CPU : WASM_SIMD = 1 | AARCH64_REPACK = 1 | 
operator(): processing 301348 samples, 18.8 sec, 8 threads, 1 processors, lang = zh, task = transcribe ...

js: full_default returned: 0
[00:00:00.000 --> 00:00:03.200]  1...
[00:00:03.200 --> 00:00:04.200]  2...
[00:00:04.200 --> 00:00:06.000]  3...

whisper_print_timings:     load time =   101.15 ms
whisper_print_timings:     fallbacks =   0 p /   0 h
whisper_print_timings:      mel time =   122.17 ms
whisper_print_timings:   sample time =   142.72 ms /     1 runs (   142.72 ms per run)
whisper_print_timings:   encode time =  3546.13 ms /     1 runs (  3546.13 ms per run)
whisper_print_timings:   decode time =  1207.24 ms /   104 runs (    11.61 ms per run)
whisper_print_timings:   batchd time =    65.25 ms /     3 runs (    21.75 ms per run)
whisper_print_timings:   prompt time =     0.00 ms /     1 runs (     0.00 ms per run)
whisper_print_timings:    total time =  5089.07 ms
```