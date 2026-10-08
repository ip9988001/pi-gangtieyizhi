#!/usr/bin/env python3
"""
幽灵复刻同步守护进程

负责定期同步系统状态到备份位置
"""

import os
import json
import shutil
import datetime
import hashlib

class SyncDaemon:
    def __init__(self, config_path="soul_manifest.json"):
        self.config_path = config_path
        self.config = self.load_config()
        
    def load_config(self):
        """加载配置"""
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def get_memory_dir(self):
        """获取记忆目录"""
        home = os.path.expanduser("~")
        return os.path.join(home, ".pi", "agent", "memory")
    
    def get_backup_dir(self):
        """获取备份目录"""
        home = os.path.expanduser("~")
        return os.path.join(home, ".pi", "agent", "backups")
    
    def create_snapshot(self):
        """创建系统快照"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        snapshot_dir = os.path.join(self.get_backup_dir(), f"snapshot_{timestamp}")
        
        os.makedirs(snapshot_dir, exist_ok=True)
        
        memory_dir = self.get_memory_dir()
        if os.path.exists(memory_dir):
            # 复制关键文件
            critical_files = [
                "START_HERE.md",
                "HANDOFF_CHAIN.md",
                "STAGE_TRACKER.md",
                "INDEX.md"
            ]
            
            for file_name in critical_files:
                src = os.path.join(memory_dir, file_name)
                if os.path.exists(src):
                    shutil.copy2(src, snapshot_dir)
        
        # 保存快照元数据
        metadata = {
            "snapshot_id": f"snapshot_{timestamp}",
            "created_at": datetime.datetime.now().isoformat(),
            "memory_dir": memory_dir,
            "files_copied": os.listdir(snapshot_dir) if os.path.exists(snapshot_dir) else []
        }
        
        metadata_path = os.path.join(snapshot_dir, "snapshot_metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        return snapshot_dir
    
    def calculate_checksum(self, filepath):
        """计算文件校验和"""
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    def sync(self):
        """执行同步"""
        print(f"[{datetime.datetime.now()}] 开始同步...")
        
        snapshot_dir = self.create_snapshot()
        print(f"[{datetime.datetime.now()}] 快照已创建: {snapshot_dir}")
        
        return snapshot_dir

if __name__ == "__main__":
    daemon = SyncDaemon()
    daemon.sync()
