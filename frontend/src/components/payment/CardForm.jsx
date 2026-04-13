function fmt4(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExp(val) {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

export default function CardForm({ data, onChange, errors }) {
    const set = (key, transform = v => v) => e =>
        onChange({ ...data, [key]: transform(e.target.value) });

    return (
        <div className="pay-card-form">
            <div className="pay-field">
                <label className="pay-label">Cardholder Name</label>
                <input className={`pay-input${errors.name ? ' pay-input--error' : ''}`}
                    placeholder="Name on card" value={data.name}
                    onChange={set('name')} autoComplete="cc-name" />
                {errors.name && <span className="pay-field-error">{errors.name}</span>}
            </div>

            <div className="pay-field">
                <label className="pay-label">Card Number</label>
                <input className={`pay-input pay-input--mono${errors.number ? ' pay-input--error' : ''}`}
                    placeholder="1234 5678 9012 3456" value={data.number}
                    onChange={set('number', fmt4)} inputMode="numeric"
                    autoComplete="cc-number" maxLength={19} />
                {errors.number && <span className="pay-field-error">{errors.number}</span>}
            </div>

            <div className="pay-row2">
                <div className="pay-field">
                    <label className="pay-label">Expiry</label>
                    <input className={`pay-input pay-input--mono${errors.expiry ? ' pay-input--error' : ''}`}
                        placeholder="MM/YY" value={data.expiry}
                        onChange={set('expiry', fmtExp)} inputMode="numeric"
                        autoComplete="cc-exp" maxLength={5} />
                    {errors.expiry && <span className="pay-field-error">{errors.expiry}</span>}
                </div>
                <div className="pay-field">
                    <label className="pay-label">CVV</label>
                    <input className={`pay-input pay-input--mono${errors.cvv ? ' pay-input--error' : ''}`}
                        placeholder="•••" value={data.cvv} type="password"
                        onChange={set('cvv', v => v.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric" autoComplete="cc-csc" maxLength={4} />
                    {errors.cvv && <span className="pay-field-error">{errors.cvv}</span>}
                </div>
            </div>

            <p className="pay-secure-note">🔒 Your card details are encrypted and never stored.</p>
        </div>
    );
}
