import React, { useState, useEffect } from 'react';
import { X, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  username: string;
  status: string;
  created_at: string;
}

interface MailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MailboxModal({ isOpen, onClose }: MailboxModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-emerald-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Clock className="text-yellow-400" size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800/95 rounded-2xl p-8 max-w-2xl w-full m-4 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Mail className="text-emerald-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Your Orders</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400">No orders found</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">
                    Username: {order.username}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className={`${getStatusColor(order.status)} capitalize`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Ordered on: {new Date(order.created_at).toLocaleDateString()}
                </div>
                {order.status === 'approved' && (
                  <div className="mt-3 p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                    <p className="text-emerald-400 text-sm">
                      Your account details will be sent to your registered email address.
                    </p>
                  </div>
                )}
                {order.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <p className="text-red-400 text-sm">
                      Your order was rejected. Please contact support for more information.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}