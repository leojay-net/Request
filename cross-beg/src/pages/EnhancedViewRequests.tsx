import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Jazzicon } from "@/components/Jazzicon";
import { Clock, Calendar, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { initiateBasePayment, checkBasePayReadiness } from "@/lib/basePay";
import {
    getUserRequests,
    getUserPayments,
    getPaymentRequest,
    formatAmount,
    RequestStatus,
    type PaymentRequestData
} from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

interface RequestWithDetails extends PaymentRequestData {
    formattedAmount: string;
    formattedCreatedAt: string;
    formattedDueDate: string;
}

export function EnhancedViewRequests() {
    const [sentRequests, setSentRequests] = useState<RequestWithDetails[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<RequestWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [payingRequestId, setPayingRequestId] = useState<string | null>(null);

    const { isConnected, userAddress, connectWallet } = useWallet();
    const { toast } = useToast();

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.Pending:
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
            case RequestStatus.Paid:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Paid</Badge>;
            case RequestStatus.Cancelled:
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Cancelled</Badge>;
            case RequestStatus.Expired:
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Expired</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const formatDate = (timestamp: bigint): string => {
        if (timestamp === BigInt(0)) return "No due date";
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleDateString();
    };

    const formatRequestData = (request: PaymentRequestData): RequestWithDetails => {
        return {
            ...request,
            formattedAmount: formatAmount(request.amount),
            formattedCreatedAt: formatDate(request.createdAt),
            formattedDueDate: formatDate(request.dueDate)
        };
    };

    const loadRequests = async () => {
        if (!userAddress) return;

        setIsLoading(true);
        try {
            // Load sent requests (user created)
            const sentRequestIds = await getUserRequests(userAddress);
            const sentRequestsData = await Promise.all(
                sentRequestIds.map(id => getPaymentRequest(id))
            );
            setSentRequests(sentRequestsData.map(formatRequestData));

            // Load received requests (user needs to pay)
            const receivedRequestIds = await getUserPayments(userAddress);
            const receivedRequestsData = await Promise.all(
                receivedRequestIds.map(id => getPaymentRequest(id))
            );
            setReceivedRequests(receivedRequestsData.map(formatRequestData));

        } catch (error) {
            console.error("Error loading requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected && userAddress) {
            loadRequests();
        }
    }, [isConnected, userAddress]);

    const handlePayRequest = async (request: RequestWithDetails) => {
        setPayingRequestId(request.id.toString());

        try {
            // Show tip about Base Pay
            toast({
                title: "� Base Pay",
                description: "Processing payment with Base Pay - works with any connected wallet!",
                duration: 3000,
            });

            // Check if wallet is ready for Base Pay
            const readiness = await checkBasePayReadiness();
            if (!readiness.ready) {
                toast({
                    title: "Wallet not ready",
                    description: `${readiness.message}. ${readiness.suggestion}`,
                    variant: "destructive"
                });
                return;
            }

            // Convert the bigint amount to USD amount for Base Pay
            const usdAmount = Number(request.amount) / 1_000_000; // Convert from USDC units (6 decimals) to USD

            const paymentResult = await initiateBasePayment({
                requestId: request.id.toString(),
                amount: usdAmount.toString(),
                recipient: request.requester,
                description: `Payment for: ${request.description}`,
                isGoods: false
            });

            if (paymentResult.success) {
                toast({
                    title: "Payment initiated!",
                    description: "Your payment is being processed.",
                });

                // Reload requests after a delay to show updated status
                setTimeout(() => {
                    loadRequests();
                }, 3000);
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Payment failed",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                variant: "destructive"
            });
        } finally {
            setPayingRequestId(null);
        }
    };

    const handlePaymentComplete = () => {
        // Reload requests to show updated status
        loadRequests();
    };

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Connect Wallet</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">
                            Connect your wallet to view your payment requests
                        </p>
                        <Button onClick={connectWallet}>
                            Connect Wallet
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Payment Requests</h1>
                    <p className="text-muted-foreground">
                        View and manage your payment requests on Base Sepolia
                    </p>
                </div>
                <Button
                    onClick={loadRequests}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Base Pay Info Banner */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-blue-600 mt-0.5">
                            💳
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">Base Pay Integration</h3>
                            <p className="text-blue-800 text-sm mb-2">
                                ✨ <strong>Any user can pay</strong> – works with every connected wallet out of the box.
                            </p>
                            <p className="text-blue-700 text-xs">
                                <strong>USDC, not gas:</strong> You pay in dollars; gas sponsorship is handled automatically. •
                                <strong> Fast:</strong> Most payments confirm in &lt;2 seconds on Base.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="received" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="received">
                        Requests to Pay ({receivedRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        Requests Sent ({sentRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading requests...
                        </div>
                    ) : receivedRequests.length > 0 ? (
                        receivedRequests.map((request) => (
                            <Card key={request.id.toString()}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <Jazzicon address={request.requester} size={40} />
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-semibold">Request #{request.id.toString()}</p>
                                                    {getStatusBadge(request.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    From: {request.requester.slice(0, 6)}...{request.requester.slice(-4)}
                                                </p>
                                                <p className="text-sm">{request.description}</p>
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {request.formattedCreatedAt}
                                                    </div>
                                                    {request.dueDate !== BigInt(0) && (
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            Due: {request.formattedDueDate}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-2xl font-bold">
                                                ${request.formattedAmount} USD
                                            </p>
                                            {request.status === RequestStatus.Pending && (
                                                <Button
                                                    onClick={() => handlePayRequest(request)}
                                                    size="sm"
                                                    disabled={payingRequestId === request.id.toString()}
                                                >
                                                    {payingRequestId === request.id.toString() ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Paying...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            Pay Now
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {request.status === RequestStatus.Paid && request.paymentReference && (
                                                <p className="text-xs text-muted-foreground">
                                                    Ref: {request.paymentReference.slice(0, 8)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-muted-foreground">No payment requests to pay</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="sent" className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading requests...
                        </div>
                    ) : sentRequests.length > 0 ? (
                        sentRequests.map((request) => (
                            <Card key={request.id.toString()}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <Jazzicon address={request.payer} size={40} />
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-semibold">Request #{request.id.toString()}</p>
                                                    {getStatusBadge(request.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    To: {request.payer.slice(0, 6)}...{request.payer.slice(-4)}
                                                </p>
                                                <p className="text-sm">{request.description}</p>
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {request.formattedCreatedAt}
                                                    </div>
                                                    {request.dueDate !== BigInt(0) && (
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            Due: {request.formattedDueDate}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-2xl font-bold">
                                                ${request.formattedAmount} USD
                                            </p>
                                            {request.status === RequestStatus.Paid && request.paymentReference && (
                                                <p className="text-xs text-muted-foreground">
                                                    Ref: {request.paymentReference.slice(0, 8)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-muted-foreground">No payment requests sent</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
