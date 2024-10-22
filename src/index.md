---
toc: false
---

```js
import * as React from 'react';
import NetworkGraph from './components/NetworkGraph.js';

```

```js
const connections = FileAttachment("./data/updated_formatted_tasks.csv").csv();
const metrics = FileAttachment("./data/metrics.csv").csv();
```

<div class="hero">
  <h1>The SDG Hyperspace</h1>

  The network graph that this project results in will demonstrate connections between individual metrics or sensing capabilities of spaceborne instruments. Results can be used to infer the reliability with which individual metrics can be remotely sensed. 
  Key elements of the graph include:

  <b> Nodes: </b> Every node represents a specific metric that (perhaps) could be sensed from space. Click on a node to reveal additional information, including datasets measuring this metric and prior predictive baselines.  

  <b> Links: </b> Currently, each link between nodes is colour-coded to a specific SDG of relevance. Where avaialable, the strength of this link (as measured by established correlations in prior literature), will be shown as the weight of the line. 
</div>

```js
NetworkGraph(connections, metrics)
```

<style>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 0rem;
  text-wrap: balance;
  text-align: center;
}

/* Your other styles... */
</style>