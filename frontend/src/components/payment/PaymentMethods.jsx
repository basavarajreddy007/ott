import CardForm from './CardForm';

const METHODS = ['card', 'upi', 'wallet'];
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik', 'Freecharge'];

export default function PaymentMethods({ method, onMethodChange, cardData, onCardChange, cardErrors, upiId, onUpiChange, upiError, wallet, onWalletChange, walletError }) {
    return (
        <div className="pay-methods">
            <p className="pay-methods__title">Payment Method</p>

            <div className="pay-method-tabs">
                {METHODS.map(m => (
                    <button key={m} type="button"
                        className={`pay-method-tab${method === m ? ' active' : ''}`}
                        onClick={() => onMethodChange(m)}>
                        {m === 'card' ? '💳 Card' : m === 'upi' ? '⚡ UPI' : '👛 Wallet'}
                    </button>
                ))}
            </div>

            <div className="pay-method-body">
                {method === 'card' && (
                    <CardForm data={cardData} onChange={onCardChange} errors={cardErrors} />
                )}

                {method === 'upi' && (
                    <div className="pay-field">
                        <label className="pay-label">UPI ID</label>
                        <input className={`pay-input${upiError ? ' pay-input--error' : ''}`}
                            placeholder="name@upi" value={upiId}
                            onChange={e => onUpiChange(e.target.value)} />
                        {upiError && <span className="pay-field-error">{upiError}</span>}
                        <p className="pay-hint">e.g. name@okaxis · name@paytm · name@ybl</p>
                    </div>
                )}

                {method === 'wallet' && (
                    <div className="pay-field">
                        <label className="pay-label">Select Wallet</label>
                        <div className="pay-wallet-list">
                            {WALLETS.map(w => (
                                <label key={w} className={`pay-wallet-option${wallet === w ? ' active' : ''}`}>
                                    <input type="radio" name="wallet" value={w}
                                        checked={wallet === w} onChange={() => onWalletChange(w)}
                                        style={{ accentColor: 'var(--accent)' }} />
                                    {w}
                                </label>
                            ))}
                        </div>
                        {walletError && <span className="pay-field-error">{walletError}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
