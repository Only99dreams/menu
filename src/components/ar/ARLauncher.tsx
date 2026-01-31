import { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Loader2, Move3D, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

// AR Status types
type ARStatus =
  | 'loading'
  | 'ready'
  | 'launching'
  | 'session-started'
  | 'object-placed'
  | 'ended'
  | 'failed'
  | 'not-supported';

interface ARLauncherProps {
  modelSrc: string;
  itemName: string;
  onClose: () => void;
  onARNotSupported?: () => void;
}

export function ARLauncher({ modelSrc, itemName, onClose, onARNotSupported }: ARLauncherProps) {
  const modelRef = useRef<HTMLElement>(null);
  const [arStatus, setArStatus] = useState<ARStatus>('loading');
  const statusRef = useRef<ARStatus>('loading');
  const arSessionActiveRef = useRef(false);
  const launchAttemptedRef = useRef(false);

  const setStatus = (next: ARStatus) => {
    statusRef.current = next;
    setArStatus(next);
  };

  useEffect(() => {
    const modelViewer = modelRef.current;
    if (!modelViewer) return;

    const handleLoad = () => {
      console.log('[AR] Model loaded, checking AR support...');
      setStatus('ready');
    };

    const handleARStatus = (event: Event) => {
      const customEvent = event as CustomEvent;
      const status = customEvent.detail?.status;
      console.log('[AR] Status changed:', status);
      
      if (status === 'session-started') {
        arSessionActiveRef.current = true;
        setStatus('session-started');
      } else if (status === 'object-placed') {
        setStatus('object-placed');
      } else if (status === 'failed') {
        console.log('[AR] Session failed');
        arSessionActiveRef.current = false;
        setStatus('failed');
      } else if (status === 'not-presenting') {
        // IMPORTANT: not-presenting can occur transiently; never auto-close here.
        // Also, don't rely on React state here (async); use refs.
        console.log('[AR] not-presenting; sessionActive=', arSessionActiveRef.current, 'currentStatus=', statusRef.current);

        if (arSessionActiveRef.current) {
          // User exited AR normally or session ended
          arSessionActiveRef.current = false;
          setStatus('ended');
          return;
        }

        // If we attempted to launch and never got session-started, treat as failure
        if (launchAttemptedRef.current && statusRef.current === 'launching') {
          setStatus('failed');
        }
      }
    };

    const handleError = (e: Event) => {
      console.error('[AR] Model error:', e);
      setArStatus('failed');
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('ar-status', handleARStatus);
    modelViewer.addEventListener('error', handleError);

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('ar-status', handleARStatus);
      modelViewer.removeEventListener('error', handleError);
    };
  }, []);

  const tryLaunchAR = () => {
    const modelViewer = modelRef.current as any;
    console.log('[AR] Attempting to launch AR, canActivateAR:', modelViewer?.canActivateAR);
    
    if (modelViewer?.canActivateAR) {
      launchAttemptedRef.current = true;
      setStatus('launching');
      try {
        modelViewer.activateAR();
      } catch (e) {
        console.error('[AR] activateAR threw:', e);
        setStatus('failed');
      }
    } else {
      console.log('[AR] AR not available on this device');
      setStatus('not-supported');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Move3D className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif font-bold">{itemName}</h2>
            <p className="text-sm text-muted-foreground">AR Experience</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Model Viewer (hidden, used to trigger AR) */}
      <div className="flex-1 relative bg-muted/30">
        <model-viewer
          ref={modelRef}
          src={modelSrc}
          alt={itemName}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          auto-rotate
          shadow-intensity="1.5"
          shadow-softness="1"
          exposure="1.2"
          interaction-prompt="none"
          camera-orbit="30deg 75deg 105%"
          ar-scale="auto"
          ar-placement="floor"
          xr-environment
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />

        {/* AR Status Overlay */}
        <AnimatePresence mode="wait">
          {arStatus === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-medium">Preparing AR Experience</p>
                  <p className="text-sm text-muted-foreground">Loading 3D model...</p>
                </div>
              </div>
            </motion.div>
          )}

          {arStatus === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-4 bottom-4"
            >
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Move3D className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Ready for AR</p>
                    <p className="text-sm text-muted-foreground">Tap below to open your camera</p>
                  </div>
                </div>
                <Button variant="hero" className="w-full" onClick={tryLaunchAR}>
                  <Move3D className="w-4 h-4 mr-2" />
                  Launch AR
                </Button>
              </div>
            </motion.div>
          )}

          {arStatus === 'launching' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                  <Move3D className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    Opening AR Camera...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If it closes immediately, allow Camera permission for this site and try again.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {(arStatus === 'not-supported' || arStatus === 'failed' || arStatus === 'ended') && (
            <ARInstructions
              modelRef={modelRef}
              arStatus={arStatus}
              onRetryAR={tryLaunchAR}
              onContinue3D={() => {
                // Optional: allow parent to fall back to the 3D-only preview modal
                onARNotSupported?.();
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Instructions */}
      {(arStatus === 'session-started' || arStatus === 'object-placed') && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent"
        >
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-lg">
            {arStatus === 'session-started' ? (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Hand className="w-5 h-5" />
                  <span className="font-medium">Point at a flat surface</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan your table or floor, then tap to place
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <PinchZoom className="w-5 h-5" />
                  <span className="font-medium">{itemName} placed!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pinch to resize • Drag to move
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Fallback instructions when AR is not supported
function ARInstructions({
  modelRef,
  arStatus,
  onRetryAR,
  onContinue3D,
}: {
  modelRef: React.RefObject<HTMLElement>;
  arStatus: 'not-supported' | 'failed' | 'ended';
  onRetryAR: () => void;
  onContinue3D: () => void;
}) {
  const title =
    arStatus === 'not-supported'
      ? 'AR Not Supported'
      : arStatus === 'ended'
        ? 'AR Session Ended'
        : 'AR Could Not Start';

  const description =
    arStatus === 'not-supported'
      ? "This device/browser doesn't support AR. You can still explore the 3D model here."
      : arStatus === 'ended'
        ? 'You exited AR. You can launch it again anytime.'
        : 'AR closed immediately—this is commonly caused by camera permission being denied for this site. Allow Camera access and retry.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute bottom-4 left-4 right-4"
    >
      <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-lg">
        <div className="text-center space-y-3">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onRetryAR}
            >
              Try Again
            </Button>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => {
                const mv = modelRef.current as any;
                if (mv?.activateAR) mv.activateAR();
              }}
            >
              <Move3D className="w-4 h-4 mr-2" />
              Launch AR
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={onContinue3D}
            >
              Continue in 3D Preview
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Custom PinchZoom icon since lucide doesn't have one
function PinchZoom({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 6L2 2m4 4V2m0 4H2" />
      <path d="M18 18l4 4m-4-4v4m0-4h4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
