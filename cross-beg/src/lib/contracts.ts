import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Contract configuration
export const PAYMENT_REQUEST_CONTRACT_ADDRESS = '0xE455605768F153839Cd269f3cd17E90B56b7B21A' as const;
export const PAYMENT_PROCESSOR_ADDRESS = '0xeD6c9f2573343043DD443bc633f9071ABDF688Fd' as const;

// Chain configuration - using Base Sepolia for testnet
export const CHAIN = baseSepolia;

// Contract ABI for PaymentRequest
export const PAYMENT_REQUEST_ABI = [
    {
        "type": "function",
        "name": "createRequest",
        "inputs": [
            { "name": "_payer", "type": "address" },
            { "name": "_amount", "type": "uint256" },
            { "name": "_description", "type": "string" },
            { "name": "_dueDate", "type": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "confirmPayment",
        "inputs": [
            { "name": "_requestId", "type": "uint256" },
            { "name": "_paymentReference", "type": "string" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getRequest",
        "inputs": [{ "name": "_requestId", "type": "uint256" }],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "components": [
                    { "name": "id", "type": "uint256" },
                    { "name": "requester", "type": "address" },
                    { "name": "payer", "type": "address" },
                    { "name": "amount", "type": "uint256" },
                    { "name": "description", "type": "string" },
                    { "name": "createdAt", "type": "uint256" },
                    { "name": "dueDate", "type": "uint256" },
                    { "name": "status", "type": "uint8" },
                    { "name": "paymentReference", "type": "string" },
                    { "name": "exists", "type": "bool" }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getUserRequests",
        "inputs": [{ "name": "_user", "type": "address" }],
        "outputs": [{ "name": "", "type": "uint256[]" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getUserPayments",
        "inputs": [{ "name": "_user", "type": "address" }],
        "outputs": [{ "name": "", "type": "uint256[]" }],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "RequestCreated",
        "inputs": [
            { "name": "requestId", "type": "uint256", "indexed": true },
            { "name": "requester", "type": "address", "indexed": true },
            { "name": "payer", "type": "address", "indexed": true },
            { "name": "amount", "type": "uint256", "indexed": false },
            { "name": "description", "type": "string", "indexed": false },
            { "name": "dueDate", "type": "uint256", "indexed": false }
        ]
    },
    {
        "type": "event",
        "name": "RequestPaid",
        "inputs": [
            { "name": "requestId", "type": "uint256", "indexed": true },
            { "name": "payer", "type": "address", "indexed": true },
            { "name": "paymentReference", "type": "string", "indexed": false }
        ]
    }
] as const;

// Request status enum
export enum RequestStatus {
    Pending = 0,
    Paid = 1,
    Cancelled = 2,
    Expired = 3
}

// Request type
export interface PaymentRequestData {
    id: bigint;
    requester: string;
    payer: string;
    amount: bigint;
    description: string;
    createdAt: bigint;
    dueDate: bigint;
    status: RequestStatus;
    paymentReference: string;
    exists: boolean;
}

// Create public client for reading from blockchain
export const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http()
});

// Create wallet client for transactions (will be used with Privy)
export const createWalletClientWithPrivy = async (walletProvider: any) => {
    if (!walletProvider) {
        throw new Error('Wallet provider is not available. Please connect your wallet.');
    }

    // Await the provider if it's a Promise (Privy returns a Promise)
    const provider = await Promise.resolve(walletProvider);

    if (!provider) {
        throw new Error('Failed to resolve wallet provider.');
    }

    console.log('Creating wallet client with resolved provider:', provider);

    return createWalletClient({
        chain: CHAIN,
        transport: custom(provider)
    });
};

// Utility functions
export const formatAmount = (amount: bigint): string => {
    // Format USDC amount (6 decimals) to USD
    const usdAmount = Number(amount) / 1_000_000;
    return usdAmount.toFixed(2);
};

export const parseAmount = (amount: string): bigint => {
    // For USDC (6 decimals) - convert USD amount to USDC units
    // 1 USD = 1,000,000 USDC units (6 decimals)
    const usdAmount = parseFloat(amount);
    return BigInt(Math.round(usdAmount * 1_000_000));
};

// Contract interaction functions
export const createPaymentRequest = async (
    walletProvider: any,
    userAddress: string,
    payer: string,
    amount: string,
    description: string,
    dueDate?: Date
) => {
    if (!walletProvider) {
        throw new Error('Wallet provider is not available. Please connect your wallet and try again.');
    }

    if (!userAddress) {
        throw new Error('User address is not available. Please connect your wallet.');
    }

    const walletClient = await createWalletClientWithPrivy(walletProvider);

    const dueDateTimestamp = dueDate ? BigInt(Math.floor(dueDate.getTime() / 1000)) : BigInt(0);

    const hash = await walletClient.writeContract({
        address: PAYMENT_REQUEST_CONTRACT_ADDRESS,
        abi: PAYMENT_REQUEST_ABI,
        functionName: 'createRequest',
        args: [payer as `0x${string}`, parseAmount(amount), description, dueDateTimestamp],
        account: userAddress as `0x${string}`,
        chain: CHAIN
    });

    return hash;
};

export const getPaymentRequest = async (requestId: bigint): Promise<PaymentRequestData> => {
    const result = await publicClient.readContract({
        address: PAYMENT_REQUEST_CONTRACT_ADDRESS,
        abi: PAYMENT_REQUEST_ABI,
        functionName: 'getRequest',
        args: [requestId]
    });

    return result as PaymentRequestData;
};

export const getUserRequests = async (userAddress: string): Promise<bigint[]> => {
    const result = await publicClient.readContract({
        address: PAYMENT_REQUEST_CONTRACT_ADDRESS,
        abi: PAYMENT_REQUEST_ABI,
        functionName: 'getUserRequests',
        args: [userAddress as `0x${string}`]
    });

    return result as bigint[];
};

export const getUserPayments = async (userAddress: string): Promise<bigint[]> => {
    const result = await publicClient.readContract({
        address: PAYMENT_REQUEST_CONTRACT_ADDRESS,
        abi: PAYMENT_REQUEST_ABI,
        functionName: 'getUserPayments',
        args: [userAddress as `0x${string}`]
    });

    return result as bigint[];
};
