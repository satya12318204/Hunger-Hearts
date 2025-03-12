"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { OrderList } from "./order-list";
import { StatusToggle } from "./status-toggle";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";

interface Order {
    _id: string;
    status: string;
    donorUsername: string;
    userUsername: string;
    pickupLocation: string;
    deliveryLocation: string;
    timestamp: string;
}

interface DeliveryBoy {
    _id: string;
    deliveryBoyName: string;
    status: string;
    deliveredOrders: number;
}

export default function DeliveryBoyHomepage() {
    const [deliveryBoy, setDeliveryBoy] = useState<DeliveryBoy | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState("ongoing");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Get CSRF token if needed
            let csrfToken = Cookies.get("XSRF-TOKEN");
            if (!csrfToken) {
                const response = await fetch(
                    "http://localhost:9500/csrf-token",
                    {
                        credentials: "include",
                    }
                );
                const data = await response.json();
                csrfToken = data.csrfToken;
                Cookies.set("XSRF-TOKEN", csrfToken);
            }

            const response = await fetch(
                "http://localhost:9500/deliveryboy/getDeliveryBoyDashboard",
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setDeliveryBoy(data.deliveryboy);
            setOrders(data.orders);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast({
                title: "Error",
                description: "Failed to fetch dashboard data",
                variant: "destructive",
            });
        }
    };

    const updateOrderStatus = async (
        orderId: string,
        status: "picked-up" | "delivered",
        imageFile?: File
    ) => {
        try {
            // Get CSRF token if needed
            let csrfToken = Cookies.get("XSRF-TOKEN");
            if (!csrfToken) {
                const response = await fetch(
                    "http://localhost:9500/csrf-token",
                    {
                        credentials: "include",
                    }
                );
                const data = await response.json();
                csrfToken = data.csrfToken;
                Cookies.set("XSRF-TOKEN", csrfToken);
            }

            const endpoint =
                status === "picked-up"
                    ? "setOrderPickedUp"
                    : "setOrderDelivered";

            const formData = new FormData();
            formData.append("orderId", orderId);
            if (imageFile) {
                formData.append("image", imageFile);
            }

            const response = await fetch(
                `http://localhost:9500/order/${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                    },
                    credentials: "include",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            fetchDashboardData();
            toast({
                title: "Success",
                description: `Order marked as ${status}`,
            });
        } catch (error) {
            console.error("Error updating order status:", error);
            toast({
                title: "Error",
                description: "Failed to update order status",
                variant: "destructive",
            });
        }
    };

    const handleOrderDelivered = (order: Order) => {
        setSelectedOrder(order);
    };

    const handleImageUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (selectedOrder && imageFile) {
            await updateOrderStatus(selectedOrder._id, "delivered", imageFile);
            setSelectedOrder(null);
            setImageFile(null);
        } else {
            toast({
                title: "Error",
                description: "Image upload is required to mark the order as delivered",
                variant: "destructive",
            });
        }
    };

    const handleLogout = () => {
        Cookies.remove("deliveryboy_jwt");
        Cookies.remove("XSRF-TOKEN");
        router.push("/");
    };

    if (!deliveryBoy) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        Welcome, {deliveryBoy.deliveryBoyName}
                    </CardTitle>
                    <CardDescription>
                        Manage your deliveries and status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StatusToggle
                        deliveryBoy={deliveryBoy}
                        onStatusChange={fetchDashboardData}
                    />

                    {/* Add stats */}
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold">Your Stats</h3>
                        <p>
                            <strong>Delivered Orders:</strong>{" "}
                            {deliveryBoy.deliveredOrders}
                        </p>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="mt-6"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                            <TabsTrigger value="delivered">
                                Delivered
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="ongoing">
                            <OrderList
                                orders={orders.filter(
                                    (order) =>
                                        order.status === "on-going" ||
                                        order.status === "picked-up"
                                )}
                                updateOrderStatus={updateOrderStatus}
                                handleOrderDelivered={handleOrderDelivered}
                                type="ongoing"
                            />
                        </TabsContent>
                        <TabsContent value="delivered">
                            <OrderList
                                orders={orders.filter(
                                    (order) => order.status === "delivered"
                                )}
                                updateOrderStatus={updateOrderStatus}
                                type="delivered"
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full"
                    >
                        Logout
                    </Button>
                </CardFooter>
            </Card>

            {selectedOrder && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Upload Delivery Image</h2>
                        <form onSubmit={handleImageUpload}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                required
                            />
                            <div className="mt-4 flex justify-end">
                                <Button type="submit" className="mr-2">Upload</Button>
                                <Button variant="destructive" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
