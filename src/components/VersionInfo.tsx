'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, GitCommit, Calendar, Server } from 'lucide-react';

interface VersionData {
  version: string;
  commitHash: string;
  buildTimestamp: string;
  buildDate: string;
  environment: string;
  isProduction: boolean;
}

export function VersionInfo() {
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersionInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/version');
      if (response.ok) {
        const result = await response.json();
        setVersionData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch version info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  if (!versionData) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700">
          v{versionData.version}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            ข้อมูลเวอร์ชั่นระบบ
          </DialogTitle>
          <DialogDescription>
            ข้อมูลเวอร์ชั่นและการ build ของระบบงานรังวัด
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">เวอร์ชั่น</span>
              </div>
              <Badge variant="secondary" className="text-lg font-mono">
                v{versionData.version}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Commit</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {versionData.commitHash}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">วันที่ Build</span>
            </div>
            <p className="text-sm text-gray-600">
              {versionData.buildDate}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Environment</span>
            </div>
            <Badge 
              variant={versionData.isProduction ? "default" : "secondary"}
              className={versionData.isProduction ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
            >
              {versionData.environment}
            </Badge>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Full version: v{versionData.version}-{versionData.commitHash}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Build timestamp: {new Date(versionData.buildTimestamp).toLocaleString('th-TH')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact version for footer/header
export function VersionBadge() {
  const [versionData, setVersionData] = useState<VersionData | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setVersionData(result.data);
        }
      })
      .catch(console.error);
  }, []);

  if (!versionData) return null;

  return (
    <Badge variant="outline" className="text-xs font-mono">
      v{versionData.version}-{versionData.commitHash}
    </Badge>
  );
}