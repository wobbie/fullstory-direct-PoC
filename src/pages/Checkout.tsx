import { useEffect, useRef, useState, type FormEvent } from 'react';
import { analytics } from '../analytics';
import { useAppState } from '../state/AppState';

export function Checkout() {
  const { cart, clearCart } = useAppState();
  const [orderId, setOrderId] = useState<string | null>(null);
  const total = cart.reduce((sum, p) => sum + p.price, 0);

  const started = useRef(false);
  useEffect(() => {
    if (started.current || cart.length === 0) return;
    started.current = true;
    analytics.track('Checkout Started', { itemCount: cart.length, value: Number(total.toFixed(2)) });
  }, [cart.length, total]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = `ord_${Date.now().toString(36)}`;
    analytics.track('Order Completed', {
      orderId: id,
      itemCount: cart.length,
      revenue: Number(total.toFixed(2)),
      skus: cart.map((p) => p.sku),
    });
    setOrderId(id);
    clearCart();
  };

  if (orderId) {
    return (
      <section>
        <h1>Thank you!</h1>
        <p>Order <code>{orderId}</code> placed. Look for the <code>Order Completed</code> event in FullStory.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Checkout</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cart.map((p, i) => (
              <li key={`${p.sku}-${i}`}>{p.name}: £{p.price.toFixed(2)}</li>
            ))}
          </ul>
          <p><strong>Total: £{total.toFixed(2)}</strong></p>
          <form onSubmit={submit} className="form">
            <label>
              Full name
              <input name="name" required autoComplete="name" />
            </label>
            <label>
              Email <small className="muted">(masked: FullStory sees the shape, not the text)</small>
              <input name="email" type="email" required className="fs-mask" autoComplete="email" />
            </label>
            <label>
              Card number <small className="muted">(excluded: never leaves the browser)</small>
              <input name="card" inputMode="numeric" required className="fs-exclude" autoComplete="cc-number" />
            </label>
            <button type="submit">Place order</button>
          </form>
        </>
      )}
    </section>
  );
}
