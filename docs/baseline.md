# Reproducible baseline

Verified from default-branch commit `844a664773f9aeec86b76b1f0daaea799331e4d4`.

- Seed file: `data/seed.json`
- Seed size: `6,208,322` bytes
- Seed triples: `49,254`
- Seed SHA-256: `e9cc1679df22e19e5e713a90e57436454a70548d25f6494c8657fdf6e99f7027`
- Package manager: npm, using `package-lock.json`

Run the complete reproducibility gate with:

```bash
npm ci
npm run check
```

`npm run verify:seed` validates the seed shape and prints its current manifest. A
changed checksum is permitted only when the seed is deliberately regenerated and
the change is reviewed with its source pack provenance.
