#!/bin/bash
# 确保脚本遇到错误时停止执行
set -e

# 远程仓库URL
REMOTE_REPO_URL="https://github.com/linlifeng729/artifexServer.git"

# 获取当前分支名称
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支是 '$BRANCH_NAME'."

# 保存原始的origin URL
ORIGINAL_ORIGIN_URL=$(git remote get-url origin)
echo "原始 origin URL: $ORIGINAL_ORIGIN_URL"

# 函数：恢复原始的origin
restore_origin() {
    echo "恢复原始的 origin URL..."
    git remote set-url origin "$ORIGINAL_ORIGIN_URL"
    echo "已恢复 origin 为: $ORIGINAL_ORIGIN_URL"
}

# 设置错误处理，确保即使出错也能恢复origin
trap restore_origin EXIT

# 第一步：推送到原始仓库
echo "第一步：推送到原始仓库..."
git push origin $BRANCH_NAME
echo "✅ 成功推送到原始仓库"

# 第二步：切换并推送到目标仓库
echo "第二步：推送到目标仓库: $REMOTE_REPO_URL"
git remote set-url origin "$REMOTE_REPO_URL"
echo "已切换 origin 为: $REMOTE_REPO_URL"

echo "开始推送（尝试使用缓存的认证信息）..."
if git push origin $BRANCH_NAME 2>/dev/null; then
    echo "✅ 成功推送到目标仓库（使用缓存认证）"
else
    echo "❌ 使用缓存认证失败，需要手动输入认证信息"
    echo ""
    echo "注意：如果这是第一次访问，可能需要输入用户名和密码"
    echo "如果你有Personal Access Token，建议使用Token作为密码"
    echo ""
    
    # 询问用户GitLab用户名
    echo "为了确保认证提示正常显示，请输入你的GitLab用户名："
    read -r GITLAB_USERNAME
    
    # 在URL中包含用户名
    if [ ! -z "$GITLAB_USERNAME" ]; then
        REMOTE_REPO_URL_WITH_USER="https://${GITLAB_USERNAME}@github.com/linlifeng729/artifexServer.git"
        echo "将使用包含用户名的URL进行重试..."
        git remote set-url origin "$REMOTE_REPO_URL_WITH_USER"
        
        echo "重新尝试推送（请输入密码或Personal Access Token）..."
        if git push origin $BRANCH_NAME; then
            echo "✅ 成功推送到目标仓库"
        else
            echo "❌ 推送到目标仓库失败"
            echo ""
            echo "可能的解决方案："
            echo "1. 检查用户名密码是否正确"
            echo "2. 如果使用双因子认证，请使用Personal Access Token"
            echo "3. 确认你有推送权限"
            echo "4. 检查网络连接"
            restore_origin
            exit 1
        fi
    else
        echo "未输入用户名，推送失败"
        restore_origin
        exit 1
    fi
fi

# 第三步会在EXIT trap中自动执行
echo "🎉 代码同步成功！已推送到两个仓库"

# 执行方式
# chmod +x commit.sh