
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Types
export type ProductStatus = "pending" | "in-progress" | "completed";

export type Product = {
  id: string;
  name: string;
  type: string;
  materials: string[];
  estimatedCost: number;
  status: ProductStatus;
  createdAt: string;
};

export type Material = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
};

export type ProductionLog = {
  id: string;
  productId: string;
  productName: string;
  action: string;
  timestamp: string;
};

type DataContextType = {
  products: Product[];
  materials: Material[];
  logs: ProductionLog[];
  addProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  editProduct: (id: string, product: Partial<Omit<Product, "id" | "createdAt">>) => void;
  deleteProduct: (id: string) => void;
  addMaterial: (material: Omit<Material, "id">) => void;
  editMaterial: (id: string, material: Partial<Omit<Material, "id">>) => void;
  deleteMaterial: (id: string) => void;
  isLoading: boolean;
  downloadReport: (type: "products" | "materials" | "logs") => void;
};

// Initial mock data
const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Steel Chair",
    type: "Furniture",
    materials: ["m1", "m3"],
    estimatedCost: 250.00,
    status: "completed",
    createdAt: "2024-03-15T10:30:00Z",
  },
  {
    id: "p2",
    name: "Wooden Table",
    type: "Furniture",
    materials: ["m2"],
    estimatedCost: 450.00,
    status: "in-progress",
    createdAt: "2024-04-01T09:15:00Z",
  },
  {
    id: "p3",
    name: "Glass Vase",
    type: "Home Décor",
    materials: ["m4"],
    estimatedCost: 120.00,
    status: "pending",
    createdAt: "2024-05-05T14:45:00Z",
  },
];

const mockMaterials: Material[] = [
  { id: "m1", name: "Steel", quantity: 500, unit: "kg", supplier: "Metal Works Inc." },
  { id: "m2", name: "Oak Wood", quantity: 200, unit: "board feet", supplier: "Forest Products LLC" },
  { id: "m3", name: "Fabric", quantity: 1000, unit: "meters", supplier: "Textile Hub" },
  { id: "m4", name: "Glass", quantity: 300, unit: "kg", supplier: "Clear Vision Glass" },
];

const mockLogs: ProductionLog[] = [
  {
    id: "l1",
    productId: "p1",
    productName: "Steel Chair",
    action: "Production completed",
    timestamp: "2024-04-10T16:30:00Z",
  },
  {
    id: "l2",
    productId: "p2",
    productName: "Wooden Table",
    action: "Production started",
    timestamp: "2024-04-02T08:45:00Z",
  },
  {
    id: "l3",
    productId: "p3",
    productName: "Glass Vase",
    action: "Added to queue",
    timestamp: "2024-05-05T14:45:00Z",
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("products");
    return saved ? JSON.parse(saved).map((p: any) => ({
      ...p,
      materials: p.materials || [],
      estimatedCost: p.estimatedCost || 0
    })) : mockProducts;
  });
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem("materials");
    return saved ? JSON.parse(saved) : mockMaterials;
  });
  const [logs, setLogs] = useState<ProductionLog[]>(() => {
    const saved = localStorage.getItem("logs");
    return saved ? JSON.parse(saved) : mockLogs;
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading data from an API
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("materials", JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  // Generate a simple ID for new items
  const generateId = (prefix: string) => {
    return `${prefix}${Date.now().toString(36)}`;
  };

  // Helper to add a log entry
  const addLogEntry = (productId: string, action: string, productName?: string) => {
    let name = productName;

    if (!name) {
      const product = products.find(p => p.id === productId);
      if (product) name = product.name;
    }

    if (!name) return;

    const newLog: ProductionLog = {
      id: generateId('l'),
      productId,
      productName: name,
      action,
      timestamp: new Date().toISOString()
    };

    setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  const downloadReport = (type: "products" | "materials" | "logs") => {
    let data: Record<string, unknown>[] = [];
    let filename = "";

    if (type === "products") {
      data = products.map(p => ({
        Name: p.name,
        Type: p.type,
        "Estimated Cost": `₹${p.estimatedCost.toFixed(2)}`,
        Status: p.status,
        "Created At": new Date(p.createdAt).toLocaleDateString()
      }));
      filename = "products-report.csv";
    } else if (type === "materials") {
      data = materials.map(m => ({
        Name: m.name,
        Quantity: m.quantity,
        Unit: m.unit,
        Supplier: m.supplier
      }));
      filename = "materials-report.csv";
    } else if (type === "logs") {
      data = logs.map(l => ({
        Product: l.productName,
        Action: l.action,
        Timestamp: new Date(l.timestamp).toLocaleString()
      }));
      filename = "production-logs-report.csv";
    }

    // Convert to CSV
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Downloaded",
      description: `${filename} has been downloaded successfully.`,
      variant: "download",
    });
  };

  const addProduct = (product: Omit<Product, "id" | "createdAt">) => {
    const newProduct: Product = {
      ...product,
      id: generateId('p'),
      createdAt: new Date().toISOString()
    };

    setProducts(prevProducts => [newProduct, ...prevProducts]);
    addLogEntry(newProduct.id, "Product created", newProduct.name);

    toast({
      title: "Product added",
      description: `${newProduct.name} has been added successfully.`,
      variant: "success",
    });
  };

  const editProduct = (id: string, updates: Partial<Omit<Product, "id" | "createdAt">>) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === id ? { ...product, ...updates } : product
      )
    );

    addLogEntry(id, "Product updated");

    toast({
      title: "Product updated",
      description: "The product has been updated successfully.",
      variant: "success",
    });
  };

  const deleteProduct = (id: string) => {
    const productToDelete = products.find(p => p.id === id);

    setProducts(prevProducts =>
      prevProducts.filter(product => product.id !== id)
    );

    if (productToDelete) {
      addLogEntry(id, `Product '${productToDelete.name}' deleted`);

      toast({
        title: "Product deleted",
        description: `${productToDelete.name} has been removed.`,
        variant: "destructive",
      });
    }
  };

  const addMaterial = (material: Omit<Material, "id">) => {
    const newMaterial: Material = {
      ...material,
      id: generateId('m'),
    };

    setMaterials(prevMaterials => [...prevMaterials, newMaterial]);

    toast({
      title: "Material added",
      description: `${newMaterial.name} has been added to inventory.`,
      variant: "success",
    });
  };

  const editMaterial = (id: string, updates: Partial<Omit<Material, "id">>) => {
    setMaterials(prevMaterials =>
      prevMaterials.map(material =>
        material.id === id ? { ...material, ...updates } : material
      )
    );

    toast({
      title: "Material updated",
      description: "The material has been updated successfully.",
      variant: "success",
    });
  };

  const deleteMaterial = (id: string) => {
    const materialToDelete = materials.find(m => m.id === id);

    setMaterials(prevMaterials =>
      prevMaterials.filter(material => material.id !== id)
    );

    if (materialToDelete) {
      toast({
        title: "Material deleted",
        description: `${materialToDelete.name} has been removed from inventory.`,
        variant: "destructive",
      });
    }
  };

  return (
    <DataContext.Provider
      value={{
        products,
        materials,
        logs,
        addProduct,
        editProduct,
        deleteProduct,
        addMaterial,
        editMaterial,
        deleteMaterial,
        isLoading,
        downloadReport,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
