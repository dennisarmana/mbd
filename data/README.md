# Mock Email Dataset Generator

This system generates realistic mock email datasets for analyzing organizational miscommunication patterns across 10 different scenarios with increasing complexity.

## Structure

- `utils/` - Contains the generator code and schema definition
- `scenarios/` - Generated email datasets for each scenario
- `sample/` - A smaller sample dataset for testing

## Schema

The email datasets follow a consistent JSON schema (see `utils/schema.json`) with:

- **Scenario metadata**: Description, complexity level, key issues
- **Company structure**: Departments and employees/roles
- **Emails**: From, to, cc, timestamp, subject, and body content
- **Threads**: Grouping of related emails with participant information

## Volume

The datasets are generated with increasing volumes based on complexity:
- **Early scenarios (1-3)**: 150-200 emails per scenario
- **Middle scenarios (4-6)**: 250-400 emails per scenario
- **Complex scenarios (7-10)**: 500-1000+ emails per scenario

## Generation Scripts

- `scripts/generate-sample.js` - Creates a small sample dataset
- `scripts/generate-data.js` - Generates the full dataset for all scenarios

## Running the Generator

1. Install dependencies:
   ```
   npm install
   ```

2. Generate a sample dataset:
   ```
   npm run generate-sample
   ```

3. Generate the full dataset:
   ```
   npm run generate
   ```

## Scenarios

1. **Marketing Campaign Interpretation**: Different team members have varied understandings of campaign goals
2. **Product Launch Timeline**: Marketing and product teams disagree on the launch date
3. **Feature Priority Misalignment**: Product team sees a feature as optional, marketing sees it as crucial
4. **Resource Allocation Conflict**: Marketing, product, and finance have different resource priorities
5. **Design Feasibility Issues**: Design team creates visuals that engineering can't implement
6. **Cross-Departmental Messaging**: Marketing, sales, and support have inconsistent product messaging
7. **Budget Allocation Dispute**: Marketing plans a campaign assuming budget approval, finance disagrees
8. **Technical Language Barrier**: Marketing and engineering struggle to communicate due to technical jargon
9. **Global Campaign Misinterpretation**: Different regional teams interpret the campaign strategy differently
10. **Long-Term Strategy Alignment**: Executives, marketing, product, and finance teams align on strategy

Each scenario captures realistic communication patterns with embedded miscommunication elements that increase in complexity and organizational scope.
