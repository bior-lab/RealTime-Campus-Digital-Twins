# Price Module Decision

## Question

Should the NUS campus EMIS include electricity grid price and meter price information?

## Recommendation

Include price, but design it as a secondary module rather than a main public metric in the first version.

## Rationale

Price data is useful because it links energy use to cost, demand response, and operational planning. It can help users understand why peak demand matters, not only total energy use. It can also support AI recommendations by estimating the cost effect of load shifting, efficiency measures, and abnormal consumption.

However, price should not dominate the general-audience dashboard. Public users first need to understand energy, carbon, solar generation, and building comparison. Price can be introduced after the core energy and carbon structure is stable.

## Suggested Design

### Public View

Show cost as an interpretation layer:

- estimated daily electricity cost;
- estimated monthly building energy cost;
- cost avoided by solar generation;
- cost impact of abnormal demand;
- cost saving from recommended actions.

Avoid showing complex tariff details on the main page.

### Facility or Research View

Use a more technical price module:

- grid electricity tariff;
- time-of-use price if available;
- demand charge;
- contracted capacity;
- carbon price or shadow carbon price;
- meter-level cost allocation;
- forecasted cost under alternative operation scenarios.

### AI Insight Use

Price can support:

- peak cost prediction;
- load-shifting recommendation;
- anomaly cost impact;
- building energy budget tracking;
- carbon-cost trade-off analysis.

## Data Needed

- electricity consumption by meter or building;
- tariff structure;
- demand charge rule;
- billing period;
- solar PV generation;
- export or offset rule if applicable;
- carbon factor;
- building metadata.

## Initial Decision

For the first website version:

1. Keep price in the data model.
2. Add a cost card on building pages only if tariff assumptions are available.
3. Place tariff details in the Data Method page.
4. Do not use price as the primary homepage indicator.
5. Use estimated cost labels unless verified billing data is available.

