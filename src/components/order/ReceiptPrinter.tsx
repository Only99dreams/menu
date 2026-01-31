import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface ReceiptData {
  orderId: string;
  tableNumber: number;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  customerNotes?: string | null;
}

interface ReceiptPrinterProps {
  open: boolean;
  onClose: () => void;
  order: ReceiptData;
}

export function ReceiptPrinter({ open, onClose, order }: ReceiptPrinterProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [loading, setLoading] = useState(false);

  // Fetch order items when dialog opens
  useEffect(() => {
    if (open && order.orderId && order.items.length === 0) {
      setLoading(true);
      supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          menu_items (
            name
          )
        `)
        .eq('order_id', order.orderId)
        .then(({ data, error }) => {
          if (!error && data) {
            const fetchedItems = data.map((item: any) => ({
              name: item.menu_items?.name || 'Unknown Item',
              quantity: item.quantity,
              unit_price: item.unit_price,
            }));
            setItems(fetchedItems);
          }
          setLoading(false);
        });
    } else if (order.items.length > 0) {
      setItems(order.items);
    }
  }, [open, order.orderId, order.items]);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${order.orderId.slice(0, 8)}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 60px; text-align: right; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;

    const blob = new Blob([content.innerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${order.orderId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Receipt</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div 
            ref={receiptRef}
            className="bg-white text-black p-6 rounded-lg font-mono text-sm"
          >
            <div className="text-center mb-4">
              <h1 className="text-lg font-bold">{order.restaurantName}</h1>
              <p className="text-gray-600">Order #{order.orderId.slice(0, 8)}</p>
              <p className="text-gray-600">Table {order.tableNumber}</p>
              <p className="text-gray-600">{format(new Date(order.createdAt), 'PPpp')}</p>
            </div>

            <div className="border-t border-dashed border-black my-3" />

            <div className="space-y-2">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="flex-1">{item.name}</span>
                    <span className="w-8 text-center">x{item.quantity}</span>
                    <span className="w-16 text-right">${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No items found</p>
              )}
            </div>

            <div className="border-t border-dashed border-black my-3" />

            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>

            {order.customerNotes && (
              <>
                <div className="border-t border-dashed border-black my-3" />
                <div className="text-xs">
                  <p className="font-bold">Notes:</p>
                  <p>{order.customerNotes}</p>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-black my-3" />

            <div className="text-center text-xs text-gray-600 mt-4">
              <p>Thank you for dining with us!</p>
              <p>Powered by ARMenu</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="hero" className="flex-1" onClick={handlePrint} disabled={loading}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
