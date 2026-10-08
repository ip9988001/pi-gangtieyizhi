#!/bin/bash
# recall_memory 的 bash 包装器（Linux 版）
# 用法: bash recall.sh "搜索关键词" [top_k] [search_mode]
export HOME=/root
export PATH="/root/.local/bin:/root/.pi/agent/bin:$PATH"

QUERY="$1"; TOP_K="${2:-3}"; SEARCH_MODE="${3:-hybrid}"
if [ -z "$QUERY" ]; then
  echo "用法: bash recall.sh \"搜索关键词\" [top_k] [search_mode]"
  exit 1
fi
cd /root/.pi/agent
pi --print "请调用recall_memory工具，query参数为\"$QUERY\"，top_k为$TOP_K，search_mode为$SEARCH_MODE，直接返回结果不要解释" </dev/null 2>/dev/null
