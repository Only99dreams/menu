import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ShareableLinkProps {
  restaurantSlug: string;
  restaurantName: string;
}

export function ShareableLink({ restaurantSlug, restaurantName }: ShareableLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin;
  const menuUrl = `${baseUrl}/r/${restaurantSlug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your customers for remote ordering.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} Menu`,
          text: `Order from ${restaurantName} online!`,
          url: menuUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleOpen = () => {
    window.open(menuUrl, '_blank');
  };

  return (
    <Card variant="premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Remote Ordering Link
        </CardTitle>
        <CardDescription>
          Share this link with customers so they can browse your menu and place orders remotely.
          They can specify their table number when ordering.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={menuUrl} 
            readOnly 
            className="font-mono text-sm"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleOpen}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="hero" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Customers can access your full menu, view 3D dishes in AR, and place orders. 
          They'll enter their table number at checkout.
        </p>
      </CardContent>
    </Card>
  );
}
