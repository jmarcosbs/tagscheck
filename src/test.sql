WITH CustomerOrders AS (
    SELECT
        c.customer_id,
    --c.customer_name,
      --  o.order_id,
        o.order_date,
        od.product_id,
     --   p.product_name,
        od.quantity,
        od.price,
       -- (od.quantity * od.price) AS total_amount
    FROM
        customers c
    JOIN
        orders o ON c.customer_id = o.customer_id
    JOIN
        order_details od ON o.order_id = od.order_id
    JOIN
        products p ON od.product_id = p.product_id
),
SalesSummary AS (
    SELECT
        customer_id,
        customer_name,
        EXTRACT(YEAR FROM order_date) AS year,
        EXTRACT(MONTH FROM order_date) AS month,
        SUM(total_amount) AS monthly_sales
    FROM
        CustomerOrders
    GROUP BY
        customer_id,
        customer_name,
        year,
        month
),
MonthlySales AS (
    SELECT
        year,
        month,
        SUM(monthly_sales) AS total_sales
    FROM
        SalesSummary
    GROUP BY
        year,
        month
),
TopProducts AS (
    SELECT
        product_id,
        product_name,
        SUM(quantity) AS total_quantity_sold,
        SUM(total_amount) AS total_revenue
    FROM
        CustomerOrders
    GROUP BY
        product_id,
        product_name
    ORDER BY
        total_revenue DESC
    LIMIT 10
),
TopCustomers AS (
    SELECT
        customer_id,
        customer_name,
        SUM(total_amount) AS total_spent
    FROM
        CustomerOrders
    GROUP BY
        customer_id,
        customer_name
    ORDER BY
        total_spent DESC
    LIMIT 10
)
SELECT
    ms.year,
    ms.month,
    ms.total_sales,
    tp.product_name,
    tp.total_quantity_sold,
    tp.total_revenue,
    tc.customer_name,
    tc.total_spent
FROM
    MonthlySales ms
LEFT JOIN
    TopProducts tp ON tp.product_id IN (
        SELECT
            product_id
        FROM
            CustomerOrders
        WHERE
            EXTRACT(YEAR FROM order_date) = ms.year
            AND EXTRACT(MONTH FROM order_date) = ms.month
    )
LEFT JOIN
    TopCustomers tc ON tc.customer_id IN (
        SELECT
            customer_id
        FROM
            CustomerOrders
        WHERE
            EXTRACT(YEAR FROM order_date) = ms.year
            AND EXTRACT(MONTH FROM order_date) = ms.month
    )
ORDER BY
    ms.year,
    ms.month,
    tp.total_revenue DESC,
    tc.total_spent DESC;
