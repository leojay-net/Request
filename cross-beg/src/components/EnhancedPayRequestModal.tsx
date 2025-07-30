import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Jazzicon } from '@/components/Jazzicon';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { BasePayButton } from '@base-org/account-ui/react';
import { initiateBasePayment, pollPaymentStatus, formatPaymentDescription } from '@/lib/basePay';
import { getPaymentRequest, RequestStatus } from '@/lib/contracts';

interface EnhancedPayRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: string;
    amount: number;
    token: string;
    recipientAddress: string;
    requestId?: string; // Contract request ID
    isGoods?: boolean; // Whether this is a goods payment
}

type PaymentState = 'initial' | 'processing' | 'success' | 'error';

export function EnhancedPayRequestModal({
    isOpen,
    onClose,
    recipient,
    amount,
    token,
    recipientAddress,
    requestId,
    isGoods = false
}: EnhancedPayRequestModalProps) {
    const [paymentMethod, setPaymentMethod] = useState('USDC-base');
    const [paymentState, setPaymentState] = useState<PaymentState>('initial');
    const [paymentId, setPaymentId] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleBasePayClick = async () => {
        setPaymentState('processing');
        setErrorMessage('');

        try {
            // Initiate Base Pay payment
            const paymentResult = await initiateBasePayment({
                requestId: requestId || '',
                amount: amount.toString(),
                recipient: recipientAddress,
                description: `Payment to ${recipient}`,
                isGoods
            });

            if (!paymentResult.success) {
                throw new Error(paymentResult.error || 'Payment failed');
            }

            setPaymentId(paymentResult.id);

            // Poll for payment completion
            const finalStatus = await pollPaymentStatus(paymentResult.id);

            if (finalStatus.status === 'completed') {
                setPaymentState('success');

                // If this is a contract request, we might want to confirm it
                // Note: In a real app, you'd typically do this from a backend
                // to ensure the payment actually went through before confirming

                // Auto close after success
                setTimeout(() => {
                    onClose();
                    setPaymentState('initial');
                }, 3000);
            } else {
                throw new Error('Payment was not completed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentState('error');
            setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
        }
    };

    const handleRetry = () => {
        setPaymentState('initial');
        setErrorMessage('');
        setPaymentId('');
    };

    const handleClose = () => {
        setPaymentState('initial');
        setErrorMessage('');
        setPaymentId('');
        onClose();
    };

    // Success state
    if (paymentState === 'success') {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center text-center py-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Payment Sent!</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            Successfully paid ${amount} USD to {recipient}
                        </p>
                        {paymentId && (
                            <p className="text-xs text-muted-foreground font-mono break-all">
                                Payment ID: {paymentId}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Error state
    if (paymentState === 'error') {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center text-center py-6">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {errorMessage}
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleClose} variant="outline">
                                Close
                            </Button>
                            <Button onClick={handleRetry}>
                                Try Again
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isGoods ? 'Pay for Goods' : 'Pay Request'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Payment Summary */}
                    <div className="text-center p-6 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-center mb-4">
                            <Jazzicon address={recipientAddress} size={48} />
                        </div>
                        <h3 className="font-semibold mb-2">
                            {isGoods ? 'You are purchasing from' : 'You are paying'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{recipient}</p>
                        <p className="text-2xl font-bold text-primary mb-2">
                            ${amount} USD
                        </p>
                        {requestId && (
                            <p className="text-xs text-muted-foreground">
                                Request ID: {requestId}
                            </p>
                        )}
                    </div>

                    {/* Payment Method Info */}
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                        <h4 className="text-sm font-medium text-blue-900">How Base Pay Works</h4>
                        <p className="text-xs text-blue-700">
                            • Works with any wallet (MetaMask, Coinbase Wallet, etc.)
                        </p>
                        <p className="text-xs text-blue-700">
                            • Requires USDC on Base network
                        </p>
                        <p className="text-xs text-blue-700">
                            • Gas fees automatically sponsored - you only pay the amount
                        </p>
                        <div className="pt-1">
                            <a
                                href="https://faucet.circle.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                Need test USDC? Get it from Circle Faucet →
                            </a>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Pay with:</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USDC-base">USDC on Base</SelectItem>
                                <SelectItem value="USDC-ethereum">USDC on Ethereum</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fee Information */}
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Amount</span>
                            <span className="text-sm font-medium">${amount} USD</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Gas Fee</span>
                            <span className="text-sm font-medium text-green-600">Sponsored ✓</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center">
                            <span className="text-sm font-medium">Total</span>
                            <span className="text-sm font-bold">${amount} USD</span>
                        </div>
                    </div>

                    {/* Base Pay Button */}
                    <div className="flex flex-col gap-3">
                        {paymentState === 'processing' ? (
                            <Button disabled className="w-full">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Processing payment...
                            </Button>
                        ) : (
                            <BasePayButton
                                colorScheme="light"
                                onClick={handleBasePayClick}
                            />
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={paymentState === 'processing'}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
