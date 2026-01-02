---
trigger: always_on
---

# Engineering Rules

## 1. Modular Functional Decomposition with Traceable Logging

**Rule:** Refactor complex logic by decomposing functions into small, single-purpose named helpers. Avoid nested anonymous functions. Ensure every major step has a structured, namespaced log message.

### Before & After Example

#### Before (Bad)

_Monolithic function with inline logic, deep nesting, and vague debugging info._

```typescript
export async function processUserOrder(orderId: string) {
  const order = await db.getOrder(orderId)
  if (!order) return

  // BAD: Complex logic inline makes it hard to scan what this check really means
  // BAD: "Magic numbers" or specific conditions burying the business logic
  if (order.items.length === 0 || order.total <= 0) {
    console.log('Error') // BAD: Vague log, impossible to trace which user/order caused this
    return
  }

  // BAD: Deep nesting (arrow code) starts here
  if (order.status === 'pending') {
    try {
      // BAD: No logging before an external API call, so we don't know if we hung here
      const result = await paymentProvider.charge(order.total)

      if (result.success) {
        order.status = 'paid'
        await db.save(order)
        // BAD: Function matches silently on success, no confirmation log
      }
    } catch (e) {
      console.error(e) // BAD: Swallowing context. We don't know WHICH order failed.
    }
  }
}
```

#### After (Good)

_Broken down into named steps. The main function tells a clear story. Logging is namespaced and specific._

```typescript
// 1. Logic extracted into small, descriptive helpers
function isOrderValid(order: Order): boolean {
  if (order.items.length === 0 || order.total <= 0) {
    console.warn(`[OrderService] Order ${order.id} is invalid: empty items or zero total.`)
    return false
  }
  return true
}

// 2. Specific tasks isolated
async function processPayment(order: Order): Promise<boolean> {
  try {
    console.log(`[OrderService] Attempting to charge order ${order.id}...`)
    const result = await paymentProvider.charge(order.total)
    return result.success
  } catch (e) {
    console.error(`[OrderService] Payment failed for order ${order.id}:`, e)
    return false
  }
}

// 3. Main function is now an orchestrator
export async function processUserOrder(orderId: string) {
  console.log(`[OrderService] Processing order ${orderId}`)

  const order = await db.getOrder(orderId)
  if (!order) return

  if (!isOrderValid(order)) return

  if (order.status === 'pending') {
    const isPaid = await processPayment(order)
    if (isPaid) {
      order.status = 'paid'
      await db.save(order)
      console.log(`[OrderService] Order ${orderId} successfully completed.`)
    }
  }
}
```
