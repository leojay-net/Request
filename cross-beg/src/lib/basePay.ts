import { pay, getPaymentStatus } from '@base-org/account';

export interface BasePaymentRequest {
    requestId: string;
    amount: string;
    recipient: string;
    description: string;
    isGoods?: boolean;
}

export interface PaymentResult {
    id: string;
    success: boolean;
    transactionHash?: string;
    error?: string;
}

export interface PaymentStatusResult {
    status: 'pending' | 'completed' | 'failed';
    transactionHash?: string;
}

/**
 * Initiate a payment using Base Pay - follows official documentation exactly
 * @param request Payment request details
 * @returns Payment result with transaction ID
 */
export const initiateBasePayment = async (request: BasePaymentRequest): Promise<PaymentResult> => {
    try {
        // Determine recipient: for goods payment use payment processor, for requests use requester
        const recipient = request.isGoods
            ? '0xeD6c9f2573343043DD443bc633f9071ABDF688Fd' // Payment processor for goods
            : request.recipient; // Requester for payment requests

        // Parse the amount - ensure it's a proper USD string
        const usdAmount = parseFloat(request.amount).toFixed(2);

        console.log('Initiating Base Pay payment (following official docs):', {
            amount: usdAmount,
            to: recipient,
            testnet: true
        });

        // Use Base Pay exactly as shown in the official documentation
        // This should work with any connected wallet without sign-in prompts
        const result = await pay({
            amount: usdAmount,  // USD amount as string (e.g., "1.00")
            to: recipient,      // Recipient address
            testnet: true       // Base Sepolia for testing
        });

        console.log('Base Pay result:', result);

        // Extract payment ID from result - handle both success and error cases
        const paymentId = (result as any)?.id || '';

        if (!paymentId) {
            throw new Error('No payment ID returned from Base Pay');
        }

        return {
            id: paymentId,
            success: true
        };
    } catch (error) {
        console.error('Base Pay error:', error);

        let errorMessage = 'Payment failed';
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes('user rejected') || message.includes('cancelled')) {
                errorMessage = 'Payment was cancelled by user';
            } else if (message.includes('insufficient')) {
                errorMessage = 'Insufficient USDC balance. Get test USDC from Circle Faucet: https://faucet.circle.com';
            } else if (message.includes('network')) {
                errorMessage = 'Please switch to Base Sepolia network in your wallet';
            } else {
                errorMessage = error.message;
            }
        }

        return {
            id: '',
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Check the status of a Base Pay transaction
 * @param paymentId Payment ID from Base Pay
 * @returns Payment status
 */
export const checkBasePaymentStatus = async (paymentId: string): Promise<PaymentStatusResult> => {
    try {
        const { status } = await getPaymentStatus({
            id: paymentId,
            testnet: true // Must match the testnet setting from pay()
        });

        return {
            status: status as 'pending' | 'completed' | 'failed'
        };
    } catch (error) {
        console.error('Payment status check error:', error);
        return {
            status: 'failed'
        };
    }
};

/**
 * Poll payment status until completion or timeout
 * @param paymentId Payment ID from Base Pay
 * @param timeoutMs Timeout in milliseconds (default: 60000)
 * @returns Final payment status
 */
export const pollPaymentStatus = async (
    paymentId: string,
    timeoutMs: number = 60000
): Promise<PaymentStatusResult> => {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
        const status = await checkBasePaymentStatus(paymentId);

        if (status.status === 'completed' || status.status === 'failed') {
            return status;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { status: 'failed' };
};

/**
 * Check if the user's wallet is ready for Base Pay
 * @returns Object with readiness status and helpful messages
 */
export const checkBasePayReadiness = async (): Promise<{
    ready: boolean;
    message: string;
    suggestion?: string;
}> => {
    // Check if wallet is available
    if (typeof window === 'undefined' || !window.ethereum) {
        return {
            ready: false,
            message: 'No wallet detected',
            suggestion: 'Please install MetaMask or another Web3 wallet'
        };
    }

    try {
        // Check current network
        const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
        const baseSepoliaChainId = '0x14a34'; // 84532 in hex

        if (chainId !== baseSepoliaChainId) {
            return {
                ready: false,
                message: 'Wrong network detected',
                suggestion: 'Switch to Base Sepolia network in your wallet'
            };
        }

        // Check if account is connected
        const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
            return {
                ready: false,
                message: 'Wallet not connected',
                suggestion: 'Connect your wallet to continue'
            };
        }

        return {
            ready: true,
            message: 'Ready for Base Pay!'
        };
    } catch (error) {
        return {
            ready: false,
            message: 'Error checking wallet status',
            suggestion: 'Please check your wallet connection'
        };
    }
};
