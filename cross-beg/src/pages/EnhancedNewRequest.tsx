import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { createPaymentRequest, parseAmount } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

export function EnhancedNewRequest() {
    const [payerAddress, setPayerAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState<Date>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidAddress, setIsValidAddress] = useState(false);

    const { isConnected, userAddress, connectWallet, walletProvider } = useWallet();
    const { toast } = useToast();

    // Validate Ethereum address
    useEffect(() => {
        const isValid = /^0x[a-fA-F0-9]{40}$/.test(payerAddress);
        setIsValidAddress(isValid);
    }, [payerAddress]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to create a payment request.",
                variant: "destructive"
            });
            return;
        }

        if (!isValidAddress) {
            toast({
                title: "Invalid address",
                description: "Please enter a valid Ethereum address.",
                variant: "destructive"
            });
            return;
        }

        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) < 0.01) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid amount of at least $0.01 USD.",
                variant: "destructive"
            });
            return;
        }

        if (!description.trim()) {
            toast({
                title: "Description required",
                description: "Please provide a description for your payment request.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Check if wallet is properly connected
            if (!isConnected || !userAddress || !walletProvider) {
                toast({
                    title: "Wallet not connected",
                    description: "Please connect your wallet and try again.",
                    variant: "destructive"
                });
                return;
            }

            const txHash = await createPaymentRequest(
                walletProvider,
                userAddress!,
                payerAddress,
                amount,
                description,
                dueDate
            );

            toast({
                title: "Payment request created!",
                description: `Transaction submitted: ${txHash}`,
            });

            // Reset form
            setPayerAddress("");
            setAmount("");
            setDescription("");
            setDueDate(undefined);

        } catch (error) {
            console.error("Error creating payment request:", error);
            toast({
                title: "Error creating request",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Connect Wallet</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">
                            Connect your wallet to create payment requests on Base Sepolia
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
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Create Payment Request</h1>
                <p className="text-muted-foreground">
                    Request payments through smart contracts on Base Sepolia
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        New Payment Request
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Connected Wallet Info */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Creating request from: {userAddress}
                            </p>
                        </div>

                        {/* Payer Address */}
                        <div className="space-y-2">
                            <Label htmlFor="payerAddress">
                                Payer Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="payerAddress"
                                placeholder="0x..."
                                value={payerAddress}
                                onChange={(e) => setPayerAddress(e.target.value)}
                                className={cn(
                                    "font-mono",
                                    payerAddress && !isValidAddress && "border-destructive"
                                )}
                            />
                            {payerAddress && !isValidAddress && (
                                <p className="text-sm text-destructive">
                                    Please enter a valid Ethereum address
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                The Ethereum address of the person who should pay
                            </p>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Amount (USD) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <p className="text-sm text-muted-foreground">
                                Amount in USD to request (will be paid in USDC via Base Pay)
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="What is this payment for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                            <p className="text-sm text-muted-foreground">
                                Provide details about what this payment is for
                            </p>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label>Due Date (optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dueDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "PPP") : "Select due date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={setDueDate}
                                        disabled={(date) =>
                                            date < new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-sm text-muted-foreground">
                                When should this payment be made by?
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || !isValidAddress || !amount || !description.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Creating Request...
                                </>
                            ) : (
                                "Create Payment Request"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-lg">How it works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• Your payment request will be stored on Base Sepolia blockchain</p>
                    <p>• The payer will receive a notification to pay using Base Pay</p>
                    <p>• Payments are made in USDC and settle in seconds</p>
                    <p>• You'll be notified when the payment is completed</p>
                </CardContent>
            </Card>
        </div>
    );
}
