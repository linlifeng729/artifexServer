#!/bin/bash

# 获取脚本所在目录，解决 .env 挂载路径问题
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 确定 .env 文件路径：容器内为 /.env，本地开发为脚本同目录
if [ -f /.env ]; then
  ENV_FILE="/.env"
elif [ -f "${SCRIPT_DIR}/.env" ]; then
  ENV_FILE="${SCRIPT_DIR}/.env"
else
  echo "错误: 未找到 .env 文件 (已检查 /.env 和 ${SCRIPT_DIR}/.env)"
  exit 1
fi

# 加载环境变量
source "${ENV_FILE}"

# 导出所有环境变量，确保 PM2 子进程能读取
export $(grep -v '^#' "${ENV_FILE}" | grep -v '^$' | xargs) 2>/dev/null

# 如果${REPO_URL}为空 不安装依赖
if [ -z "${REPO_URL}" ]; then
  :
else
  bash -c "${REPO_URL}"
fi

eval ${COMMAND}
