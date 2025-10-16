# App Flowchart

flowchart TD
    Start[Start]
    Start --> A[Choose Auth Option]
    A --> SignIn[Sign In Page]
    A --> SignUp[Sign Up Page]
    SignIn --> FormSubmit[Submit Credentials]
    SignUp --> FormSubmit[Submit Credentials]
    FormSubmit --> AuthClient[Client Auth Functions]
    AuthClient --> APIRoute[API Auth Route]
    APIRoute --> BetterAuth[Better Auth Logic]
    BetterAuth --> Drizzle[Drizzle ORM]
    Drizzle --> Postgres[PostgreSQL Database]
    BetterAuth --> AuthResult{Auth Success Or Failure}
    AuthResult -->|Success| Redirect[Redirect To Dashboard]
    AuthResult -->|Failure| Error[Show Error Message]
    Redirect --> Dashboard[Dashboard Main Page]

    %% Business Workflows
    Dashboard --> BusinessNav{Navigate Business Functions}

    %% Inventory Management
    BusinessNav --> Inventory[Inventory Management]
    Inventory --> Materials[Raw Materials]
    Inventory --> Packaging[Packaging Management]
    Inventory --> Labels[Labels Management]

    Materials --> MaterialOps[Material Operations]
    MaterialOps --> AddMaterial[Add New Material]
    MaterialOps --> UpdateStock[Update Stock Levels]
    MaterialOps --> ManageSuppliers[Manage Supplier Info]

    %% Formulation Management
    BusinessNav --> Formulas[Formulation Management]
    Formulas --> FormulaOps[Formula Operations]
    FormulaOps --> CreateFormula[Create New Formula]
    FormulaOps --> EditFormula[Edit Existing Formula]
    FormulaOps --> VersionControl[Manage Versions]

    CreateFormula --> DragDrop[Drag & Drop Builder]
    DragDrop --> Validation{Validate Percentages}
    Validation -->|Valid| CalculateCosts[Calculate Costs]
    Validation -->|Invalid| ShowError[Show Validation Error]
    CalculateCosts --> SaveFormula[Save Formula]

    %% COGS Analysis
    BusinessNav --> COGS[COGS Analysis]
    COGS --> CostCalc[Cost Calculations]
    CostCalc --> MaterialCosts[Material Cost Breakdown]
    CostCalc --> PackagingCosts[Packaging Cost Allocation]
    CostCalc --> PricingRules[Set Pricing Rules]

    %% Production Tracking
    BusinessNav --> Production[Production Tracking]
    Production --> BatchOps[Batch Operations]
    BatchOps --> CreateBatch[Create Production Batch]
    BatchOps --> RecordConsumption[Record Material Usage]
    BatchOps --> AnalyzeVariance[Analyze Cost Variance]

    %% Client-Side Database Operations
    AddMaterial --> ClientDB[Client Database Operations]
    UpdateStock --> ClientDB
    SaveFormula --> ClientDB
    PricingRules --> ClientDB
    CreateBatch --> ClientDB

    ClientDB --> DirectDB[Direct Database Connection]
    DirectDB --> BusinessTables[Business Tables]
    BusinessTables --> InventoryTable[Inventory Tables]
    BusinessTables --> FormulaTable[Formula Tables]
    BusinessTables --> COGSTable[COGS Tables]
    BusinessTables --> ProductionTable[Production Tables]

    %% Real-time Updates
    CalculateCosts --> RealTime[Real-time Updates]
    ClientDB --> RealTime
    RealTime --> UIUpdate[Immediate UI Feedback]

    %% Error Handling
    MaterialOps --> BusinessError{Business Logic Error}
    FormulaOps --> BusinessError
    CostCalc --> BusinessError
    BatchOps --> BusinessError

    BusinessError --> Rollback[Database Rollback]
    Rollback --> UserFeedback[Show Error Message]
    UserFeedback --> RetryOption[Offer Retry Option]

    %% End States
    UIUpdate --> Success[Operation Complete]
    UserFeedback --> End[End]
    Success --> End

---
**Document Details**
- **Project ID**: 9abf8165-5741-488d-aa70-1677e11be201
- **Document ID**: 85187142-c036-4467-bd32-d6cf4aa3612d
- **Type**: custom
- **Custom Type**: app_flowchart
- **Status**: completed
- **Generated On**: 2025-10-15T15:42:28.038Z
- **Last Updated**: N/A
