# PR #584 待上传的镜像文件

这个分支只用来交接两个文件，上传完就可以删掉，不要合并。

| 文件 | 上传到镜像时的文件名 | 大小 | sha256（与 shared/modelManifest.json 一致） |
|---|---|---|---|
| `htdemucs-v2.onnx.xz` | `htdemucs-v2.onnx`（先 `xz -d` 解压） | 107902864 | `a8f542ef3a140d4879156c1b2b0bcad4b29254dcdbf0fd1ec578e3c9cdca925c` |
| `folia-runtime-darwin-x64.zip` | 原名 | 53911212 | `b6202a387b5d53c589788fa26b4fcba63ddfb0dd43b19d213bbdbf50280ef23c` |

模型用 xz 压缩是因为 GitHub 单文件上限 100 MB。

上传位置：Hugging Face `HUAI4236/folia-models`（hf-mirror 自动跟随）和 GitHub `AZURE-HUAI/folia-models` 的 release `weights-v1`。

**不要覆盖已有的 `htdemucs.onnx`**：老版本 app 还在按旧哈希下载它。

复现：`python build/htdemucs_halve_segment.py` 之后再跑 `python build/htdemucs_cut_fft.py`，见 `src/services/automix/MODELS.md` §6。runtime 包用 `node build/buildPythonRuntime.mjs darwin-x64` 构建。
