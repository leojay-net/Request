import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedPayRequestModal } from "@/components/EnhancedPayRequestModal";
import { ShoppingCart, Star } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    rating: number;
    inStock: boolean;
}

const demoProducts: Product[] = [
    {
        id: "1",
        name: "Wireless Headphones",
        price: 129.99,
        description: "Premium wireless headphones with noise cancellation",
        image: "/placeholder.svg",
        rating: 4.5,
        inStock: true
    },
    {
        id: "2",
        name: "Smart Watch",
        price: 299.99,
        description: "Fitness tracking smartwatch with GPS",
        image: "/placeholder.svg",
        rating: 4.8,
        inStock: true
    },
    {
        id: "3",
        name: "Portable Speaker",
        price: 79.99,
        description: "Waterproof Bluetooth speaker with 12-hour battery",
        image: "/placeholder.svg",
        rating: 4.3,
        inStock: false
    }
];

export function GoodsPaymentDemo() {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleBuyNow = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Demo Store</h1>
                <p className="text-muted-foreground">
                    Purchase goods using Base Pay - payments go to the merchant's payment processor
                </p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Demo Mode:</strong> Payments will be sent to the merchant's payment processor address:
                        <code className="ml-1 font-mono">0xeD6c9f2573343043DD443bc633f9071ABDF688Fd</code>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                        <div className="aspect-square bg-gray-100 relative">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                            {!product.inStock && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Badge variant="destructive">Out of Stock</Badge>
                                </div>
                            )}
                        </div>

                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-muted-foreground">{product.rating}</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

                            <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold">${product.price}</span>
                                <Button
                                    onClick={() => handleBuyNow(product)}
                                    disabled={!product.inStock}
                                    className="flex items-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {product.inStock ? "Buy Now" : "Out of Stock"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Base Pay Features */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Why Pay with Base Pay?</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            ⚡
                        </div>
                        <h3 className="font-semibold mb-1">Fast</h3>
                        <p className="text-sm text-muted-foreground">Payments confirm in &lt;2 seconds</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            💰
                        </div>
                        <h3 className="font-semibold mb-1">Low Cost</h3>
                        <p className="text-sm text-muted-foreground">Pennies in gas fees</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            🔒
                        </div>
                        <h3 className="font-semibold mb-1">Secure</h3>
                        <p className="text-sm text-muted-foreground">No chargebacks, final settlement</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            🌍
                        </div>
                        <h3 className="font-semibold mb-1">Global</h3>
                        <p className="text-sm text-muted-foreground">Works with any Base Account</p>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Modal for Goods */}
            {selectedProduct && (
                <EnhancedPayRequestModal
                    isOpen={!!selectedProduct}
                    onClose={handleCloseModal}
                    recipient="Demo Store"
                    amount={selectedProduct.price}
                    token="USD"
                    recipientAddress="0xeD6c9f2573343043DD443bc633f9071ABDF688Fd" // Payment processor
                    isGoods={true}
                />
            )}
        </div>
    );
}
