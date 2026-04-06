import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type OrderType = 'delivery' | 'dine-in';

interface OrderContextType {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orderType, setOrderType] = useState<OrderType>('dine-in'); // Boshlang'ich holat

  // Memoize the setOrderType function to prevent unnecessary re-renders
  const memoizedSetOrderType = useCallback((type: OrderType) => {
    setOrderType(type);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    orderType,
    setOrderType: memoizedSetOrderType
  }), [orderType, memoizedSetOrderType]);

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder OrderProvider ichida ishlatilishi shart");
  return context;
};