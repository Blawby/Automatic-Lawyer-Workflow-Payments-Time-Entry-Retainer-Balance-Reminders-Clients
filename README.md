# Blawby Retainer Management

## Project Structure (2024)

The project is organized for clarity, maintainability, and ease of testing. Here's how the files are structured:

```
.
├── src/
│   ├── core/         # Main entry points and triggers (e.g., Code.gs)
│   ├── services/     # Business logic: sync, email, invoice, templates
│   ├── utils/        # Utility/helper functions
│   ├── config/       # Constants and configuration
│   └── models/       # (Reserved for future data models)
│
├── test/
│   ├── data/         # Test data (CSVs), test scripts, mocks
│   ├── integration/  # (Legacy: test_data/)
│   └── unit/         # (Reserved for future unit tests)
│
├── appsscript.json   # Apps Script manifest
├── .clasp.json       # clasp project config
├── .claspignore      # clasp ignore rules
├── package.json      # Node.js test/dev dependencies
├── README.md         # This file
└── ...
```

### Key Folders
- **src/core/**: Main entry points and triggers (e.g., `dailySync`)
- **src/services/**: Core business logic (sync, email, invoice, templates)
- **src/utils/**: Utility/helper functions for sheets and data
- **src/config/**: Constants and configuration keys
- **src/models/**: (For future: data models, types)
- **test/data/**: All test data (CSV), test scripts, and mocks for local testing
- **test/integration/**: (Legacy, can be cleaned up)
- **test/unit/**: (For future unit tests)

### Development Workflow
- All Apps Script code is in `src/` and can be pushed to Google Apps Script using `clasp push`.
- All test and mock data is in `test/data/` and can be run locally with Node.js.

---

## Open Source Philosophy
Blawby Retainer Management is open source under the MIT license. Community contributions are welcome! See the CONTRIBUTING section below.

---

## Development Workflow (with clasp)

1. **Install clasp** (if you haven't):
   ```sh
   npm install -g @google/clasp
   ```
2. **Login to clasp**:
   ```sh
   clasp login
   ```
3. **Push changes to Apps Script**:
   ```sh
   clasp push
   ```
4. **Pull latest from Apps Script**:
   ```sh
   clasp pull
   ```
5. **Check logs**:
   ```sh
   clasp logs --watch
   ```

---

## Contributing
- Open issues or pull requests for bugs, features, or documentation.
- See the code structure above for where to add new features or tests.

---

## License
MIT 