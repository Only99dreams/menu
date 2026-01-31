import { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Maximize2, RotateCcw, Move3D, Loader2 } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'camera-controls'?: boolean;
          'touch-action'?: string;
          'auto-rotate'?: boolean;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          exposure?: string;
          'environment-image'?: string;
          poster?: string;
          loading?: 'auto' | 'lazy' | 'eager';
          reveal?: 'auto' | 'interaction' | 'manual';
          'interaction-prompt'?: 'auto' | 'when-focused' | 'none';
          'camera-orbit'?: string;
          'min-camera-orbit'?: string;
          'max-camera-orbit'?: string;
          'field-of-view'?: string;
          scale?: string;
          'ar-scale'?: 'auto' | 'fixed';
          'ar-placement'?: 'floor' | 'wall';
          'xr-environment'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export type ARStatusType = 'not-presenting' | 'session-started' | 'object-placed' | 'failed';

interface ARViewerProps {
  modelSrc: string;
  alt: string;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
  showARBadge?: boolean;
  autoLaunchAR?: boolean;
  onARStart?: () => void;
  onARStatusChange?: (status: ARStatusType) => void;
}

export function ARViewer({
  modelSrc,
  alt,
  className,
  showControls = true,
  autoRotate = true,
  showARBadge = true,
  autoLaunchAR = false,
  onARStart,
  onARStatusChange,
}: ARViewerProps) {
  const modelRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canAR, setCanAR] = useState(false);

  useEffect(() => {
    const modelViewer = modelRef.current as any;
    if (!modelViewer) return;

    const handleLoad = () => {
      setIsLoading(false);
      setCanAR(!!modelViewer.canActivateAR);
      
      // Auto-launch AR if requested and supported
      if (autoLaunchAR && modelViewer.canActivateAR) {
        setTimeout(() => {
          modelViewer.activateAR?.();
        }, 300);
      }
    };

    const handleARStatus = (event: Event) => {
      const customEvent = event as CustomEvent;
      const status = customEvent.detail?.status as ARStatusType;
      
      if (status === 'session-started') {
        onARStart?.();
      }
      onARStatusChange?.(status);
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('ar-status', handleARStatus);
    
    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('ar-status', handleARStatus);
    };
  }, [autoLaunchAR, onARStart, onARStatusChange]);

  const launchAR = () => {
    const modelViewer = modelRef.current as any;
    if (modelViewer?.canActivateAR) {
      modelViewer.activateAR();
    }
  };

  const resetRotation = () => {
    const modelViewer = modelRef.current as any;
    if (modelViewer) {
      modelViewer.resetTurntableRotation?.();
      modelViewer.cameraOrbit = '30deg 75deg 105%';
    }
  };

  return (
    <div className={cn("ar-container relative group", className)}>
      {showARBadge && canAR && (
        <Badge variant="ar" className="absolute top-4 left-4 z-10 gap-1.5">
          <Move3D className="w-3 h-3" />
          AR Ready
        </Badge>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-2xl z-10">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}
      
      <model-viewer
        ref={modelRef}
        src={modelSrc}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        touch-action="pan-y"
        auto-rotate={autoRotate}
        shadow-intensity="1.5"
        shadow-softness="1"
        exposure="1.2"
        interaction-prompt="none"
        camera-orbit="30deg 75deg 105%"
        min-camera-orbit="auto auto 50%"
        max-camera-orbit="auto auto 200%"
        field-of-view="30deg"
        ar-scale="auto"
        ar-placement="floor"
        xr-environment
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />

      {showControls && !isLoading && (
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-foreground/10 text-foreground hover:bg-card transition-colors"
            onClick={resetRotation}
            title="Reset rotation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {canAR && (
            <button
              className="p-2 rounded-lg bg-primary/90 backdrop-blur-sm text-primary-foreground hover:bg-primary transition-colors"
              onClick={launchAR}
              title="View in AR"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent rounded-2xl" />
    </div>
  );
}

export function ARViewerPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("ar-container flex items-center justify-center", className)}>
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
          <Move3D className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading 3D Model...</p>
      </div>
    </div>
  );
}

// Hook to check if AR is supported on the device
export function useARSupport() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for WebXR support using type assertion
    const xrNavigator = navigator as unknown as { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } };
    
    if (xrNavigator.xr) {
      xrNavigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsSupported(supported);
      }).catch(() => {
        // Fallback: check for Scene Viewer (Android) or Quick Look (iOS)
        const isAndroid = /android/i.test(navigator.userAgent);
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setIsSupported(isAndroid || isIOS);
      });
    } else {
      // Fallback for devices without WebXR API
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      setIsSupported(isAndroid || isIOS);
    }
  }, []);

  return isSupported;
}
