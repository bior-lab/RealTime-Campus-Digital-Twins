const campusBounds = [
  [103.7678, 1.2898],
  [103.7873, 1.309],
];

const campusOverview = {
  zoom: 15.58,
  pitch: 55,
  bearing: -24,
};

// Public Mapbox token is assembled from config parts, matching the BIOR
// Urban-Digital-Twins frontend pattern. URL/localStorage overrides still work.
const mapboxSiteConfig = window.NUS_EMIS_CONFIG || {};
const defaultMapboxPublicToken =
  window.NUS_EMIS_MAPBOX_TOKEN ||
  mapboxSiteConfig.mapboxAccessToken ||
  (Array.isArray(mapboxSiteConfig.mapboxAccessTokenParts)
    ? mapboxSiteConfig.mapboxAccessTokenParts.join("")
    : "");

const realtimeConfig = {
  baseUrl: "https://buildingdt.org/realtime/latest",
  liveBuildings: ["SDE4"],
  refreshMs: 60_000,
};

const historyConfig = {
  meterBaseUrl: "https://buildingdt.org/realtime/range",
  beehubBaseUrl: "https://buildingdt.org/realtime/beehub/range",
  metrics: [
    {
      key: "electricity",
      point: (building) => `${building} Calculated Building Electrical Consumption ALL`,
      label: "Electricity",
      metric: "Electricity demand",
      unit: "kWh/h",
      range: "-7d",
      bucket: "hour",
      chart: "bar",
      source: "meter",
      color: "#2f80a0",
    },
    {
      key: "cooling",
      point: (building) => `${building} Total Cooling Hourly Consumption`,
      label: "Cooling",
      metric: "Cooling energy",
      unit: "kWh/h",
      range: "-7d",
      bucket: "hour",
      chart: "bar",
      source: "meter",
      color: "#5b6f7a",
    },
    {
      key: "pv",
      point: (building) => `Act_E-Recv_${building}_ALL_Hourly_kWh`,
      componentPoints: (building) => [
        `Act_E-Recv_${building}_M1_Hourly_kWh`,
        `Act_E-Recv_${building}_M2_Hourly_kWh`,
      ],
      label: "PV generation",
      metric: "PV hourly generation",
      unit: "kWh/h",
      range: "-7d",
      bucket: "hour",
      chart: "bar",
      source: "meter",
      color: "#d88a21",
    },
    {
      key: "co2",
      point: (building) => `${building} Beehub CO2`,
      label: "CO2",
      metric: "Indoor air quality",
      unit: "ppm",
      range: "-7d",
      bucket: "hour",
      chart: "line",
      source: "beehub",
      color: "#287c6f",
    },
    {
      key: "temperature",
      point: (building) => `${building} Beehub Temperature`,
      label: "Temperature",
      metric: "Thermal condition",
      unit: "degC",
      range: "-7d",
      bucket: "hour",
      chart: "line",
      source: "beehub",
      color: "#b43b34",
    },
    {
      key: "humidity",
      point: (building) => `${building} Beehub Humidity`,
      label: "Humidity",
      metric: "Indoor humidity",
      unit: "%",
      range: "-7d",
      bucket: "hour",
      chart: "line",
      source: "beehub",
      color: "#1f5fbf",
    },
    {
      key: "airflow",
      point: (building) => `${building} Beehub VAV-L3-01 Airflow`,
      label: "Airflow",
      metric: "VAV L3-01 airflow",
      unit: "L/s",
      range: "-24h",
      bucket: "hour",
      chart: "line",
      source: "beehub",
      color: "#ef7c00",
    },
  ],
};

const aiHealthConfig = {
  building: "SDE4",
  weatherUrl: "https://api.open-meteo.com/v1/forecast",
  weather: {
    latitude: 1.2966,
    longitude: 103.7764,
  },
  clusterColors: {
    normal: "#287c6f",
    weather: "#1f5fbf",
    mildHigh: "#b43b34",
    afterHours: "#d88a21",
    standby: "#7b8d99",
  },
};

const brickGraphConfig = {
  places: ["SDE4"],
  graphs: {
    SDE4: {
      label: "SDE4",
      subtitle: "Operational Brick seed graph",
      sourceSummary: "Floorplans, ACMV schematics, schedules, and public realtime endpoint",
      sources: [
        "SDE4data/0_Floorplans: L1-L6 and roof PDFs",
        "SDE4data/1_ACMV: air loop, chilled water loop, and ACMV plans",
        "SDE4data/Schedules: GFA and architectural schedules",
        "buildingdt.org realtime API: current public live points",
      ],
      lanes: [
        {
          key: "place",
          label: "Place",
          nodes: [
            {
              id: "sde4",
              title: "SDE4",
              kind: "Building",
              brickClass: "brick:Building",
              status: "Seed",
              description: "Main SDE4 building node. This should remain the root of the operational graph.",
              source: "Floorplans and NUS focus building registry",
            },
            {
              id: "sde4-floors",
              title: "L1-L6 + Roof",
              kind: "Location set",
              brickClass: "brick:Floor",
              status: "Seed",
              description: "Floor context from SDE4 floorplan PDFs. Use for equipment location and future zone mapping.",
              source: "SDE4_L1.pdf through SDE4_Roof.pdf",
            },
          ],
        },
        {
          key: "systems",
          label: "Systems",
          nodes: [
            {
              id: "airside-system",
              title: "Airside ACMV",
              kind: "System",
              brickClass: "brick:Air_System",
              status: "Seed",
              description: "PAHU, FCU/PFCU, VAV, FAF and room-serving air path.",
              source: "@air loops.pdf and ACMV floor plans",
            },
            {
              id: "chw-system",
              title: "Chilled water",
              kind: "System",
              brickClass: "brick:Chilled_Water_System",
              status: "Seed",
              description: "CHWS/CHWR loop with BTU metering and cooling coils.",
              source: "@chilled water and refrigerant loops .pdf",
            },
            {
              id: "pv-system",
              title: "PV / electrical",
              kind: "System",
              brickClass: "brick:Electrical_System",
              status: "Live mapped",
              description: "PV hourly generation is mapped through the ALL meter, with M1/M2 retained as breakdown streams.",
              source: "Public realtime endpoint",
            },
            {
              id: "indoor-system",
              title: "Indoor sensing",
              kind: "System",
              brickClass: "brick:Zone_Air_Temperature_System",
              status: "Live mapped",
              description: "Beehub indoor environmental points and VAV airflow points.",
              source: "Public realtime endpoint",
            },
            {
              id: "water-system",
              title: "Water",
              kind: "System",
              brickClass: "brick:Water_System",
              status: "Planned",
              description: "Water stays as a placeholder until PI point mapping is validated and exposed through FastAPI.",
              source: "PI candidate discovery, not public realtime yet",
            },
          ],
        },
        {
          key: "equipment",
          label: "Equipment",
          nodes: [
            {
              id: "pahu-group",
              title: "PAHU-L2-01 / L5-01 / L6-01",
              kind: "Primary air handling",
              brickClass: "brick:AHU",
              status: "Candidate",
              description: "PAHU equipment candidates extracted from SDE4 ACMV air loop and floor plans.",
              source: "@air loops.pdf; ACMV L2/L5/L6 plans",
            },
            {
              id: "vav-group",
              title: "VAV boxes",
              kind: "Terminal units",
              brickClass: "brick:Variable_Air_Volume_Box",
              status: "Partial live",
              description: "VAVs appear on L2-L6. Current public live airflow points cover VAV-L3-01/02/03.",
              source: "ACMV floor plans and public realtime endpoint",
              pointNames: [
                "SDE4 Beehub VAV-L3-01 Airflow",
                "SDE4 Beehub VAV-L3-02 Airflow",
                "SDE4 Beehub VAV-L3-03 Airflow",
              ],
            },
            {
              id: "fcu-group",
              title: "FCU / PFCU",
              kind: "Fan coil units",
              brickClass: "brick:Fan_Coil_Unit",
              status: "Candidate",
              description: "FCU and PFCU candidates are present in the air loop and ACMV floor plans.",
              source: "@air loops.pdf and ACMV floor plans",
            },
            {
              id: "faf-group",
              title: "Fresh air fans",
              kind: "Fans",
              brickClass: "brick:Fan",
              status: "Candidate",
              description: "FAF equipment appears across L1, L2, L4, L5, and L6 plans.",
              source: "ACMV floor plans",
            },
            {
              id: "btu-meter",
              title: "Cooling BTU meter",
              kind: "Thermal meter",
              brickClass: "brick:Thermal_Energy_Meter",
              status: "Live mapped",
              description: "Main public cooling hourly stream is attached here.",
              source: "@chilled water and refrigerant loops .pdf; public realtime endpoint",
              metricKey: "cooling",
              pointNames: ["SDE4 Total Cooling Hourly Consumption"],
            },
            {
              id: "pv-meter",
              title: "PV generation meters",
              kind: "Electrical meters",
              brickClass: "brick:Electrical_Meter",
              status: "Live mapped",
              description: "ALL is the primary hourly generation stream. M1 and M2 are child meter breakdowns.",
              source: "Public realtime endpoint",
              metricKey: "pv",
              pointNames: [
                "Act_E-Recv_SDE4_ALL_Hourly_kWh",
                "Act_E-Recv_SDE4_M1_Hourly_kWh",
                "Act_E-Recv_SDE4_M2_Hourly_kWh",
              ],
            },
            {
              id: "beehub-sensors",
              title: "Beehub sensor group",
              kind: "Sensor equipment",
              brickClass: "brick:Equipment",
              status: "Live mapped",
              description: "Indoor CO2, temperature, humidity, thermostat setpoint, and VAV airflow points.",
              source: "Public realtime endpoint",
              pointNames: [
                "SDE4 Beehub CO2",
                "SDE4 Beehub Temperature",
                "SDE4 Beehub Humidity",
                "SDE4 Beehub VAV-L3-01 Airflow",
              ],
            },
          ],
        },
        {
          key: "points",
          label: "Points",
          nodes: [
            {
              id: "cooling-point",
              title: "Cooling hourly",
              kind: "Point",
              brickClass: "brick:Energy_Sensor",
              status: "Live",
              description: "SDE4 Total Cooling Hourly Consumption.",
              source: "Public realtime endpoint",
              metricKey: "cooling",
              pointNames: ["SDE4 Total Cooling Hourly Consumption"],
            },
            {
              id: "pv-all-point",
              title: "PV ALL hourly",
              kind: "Point",
              brickClass: "brick:Energy_Sensor",
              status: "Live",
              description: "Primary PV generation stream for SDE4.",
              source: "Public realtime endpoint",
              metricKey: "pv",
              pointNames: ["Act_E-Recv_SDE4_ALL_Hourly_kWh"],
            },
            {
              id: "pv-module-points",
              title: "PV M1 / M2 hourly",
              kind: "Point set",
              brickClass: "brick:Energy_Sensor",
              status: "Breakdown",
              description: "Module-level PV generation breakdown. Keep under PV meter, not as the dashboard primary value.",
              source: "Public realtime endpoint",
              pointNames: [
                "Act_E-Recv_SDE4_M1_Hourly_kWh",
                "Act_E-Recv_SDE4_M2_Hourly_kWh",
              ],
            },
            {
              id: "indoor-points",
              title: "CO2 / temp / humidity",
              kind: "Point set",
              brickClass: "brick:Point",
              status: "Live",
              description: "Beehub indoor environmental history points.",
              source: "Public realtime endpoint",
              pointNames: [
                "SDE4 Beehub CO2",
                "SDE4 Beehub Temperature",
                "SDE4 Beehub Humidity",
              ],
            },
            {
              id: "vav-airflow-points",
              title: "VAV L3 airflow",
              kind: "Point set",
              brickClass: "brick:Air_Flow_Sensor",
              status: "Live",
              description: "VAV-L3-01/02/03 airflow points. These are the first equipment-linked airflow leaves.",
              source: "Public realtime endpoint",
              metricKey: "airflow",
              pointNames: [
                "SDE4 Beehub VAV-L3-01 Airflow",
                "SDE4 Beehub VAV-L3-02 Airflow",
                "SDE4 Beehub VAV-L3-03 Airflow",
              ],
            },
            {
              id: "pv-raw-power-points",
              title: "PV raw power",
              kind: "Point set",
              brickClass: "brick:Power_Sensor",
              status: "Reference only",
              description: "PV_System.Total_kW points remain visible as raw inverter/panel power references, not the primary generation KPI.",
              source: "Public realtime endpoint",
              pointNames: [
                "SDE4 PV_System.Total_kW_DB-PV-1-1_&_2-1",
                "SDE4 PV_System.Total_kW_DB-PV-1-2_&_2-2",
              ],
            },
          ],
        },
      ],
      relations: [
        { from: "sde4", predicate: "hasPart", to: "sde4-floors" },
        { from: "sde4", predicate: "hasSystem", to: "airside-system" },
        { from: "sde4", predicate: "hasSystem", to: "chw-system" },
        { from: "sde4", predicate: "hasSystem", to: "pv-system" },
        { from: "sde4", predicate: "hasSystem", to: "indoor-system" },
        { from: "airside-system", predicate: "hasPart", to: "pahu-group" },
        { from: "airside-system", predicate: "hasPart", to: "vav-group" },
        { from: "airside-system", predicate: "hasPart", to: "fcu-group" },
        { from: "airside-system", predicate: "hasPart", to: "faf-group" },
        { from: "chw-system", predicate: "hasPoint", to: "cooling-point" },
        { from: "chw-system", predicate: "hasPart", to: "btu-meter" },
        { from: "pv-system", predicate: "hasPart", to: "pv-meter" },
        { from: "pv-meter", predicate: "hasPoint", to: "pv-all-point" },
        { from: "pv-meter", predicate: "hasPoint", to: "pv-module-points" },
        { from: "pv-meter", predicate: "hasPoint", to: "pv-raw-power-points" },
        { from: "indoor-system", predicate: "hasPart", to: "beehub-sensors" },
        { from: "beehub-sensors", predicate: "hasPoint", to: "indoor-points" },
        { from: "vav-group", predicate: "hasPoint", to: "vav-airflow-points" },
      ],
    },
  },
};

const mapboxEuiLayer = {
  sourceId: "mapbox-eui-buildings",
  sourceUrl: "mapbox://nus-bior.7xmymq8g",
  sourceLayer: "07_buildings_energy_weekly_re-1cntpw",
};

const metricConfig = {
  electricity: {
    label: "Electricity demand",
    field: "electricity_metric",
    unit: "kWh/h",
    steps: [80, 240, 440, 700],
  },
  cooling: {
    label: "Cooling energy",
    field: "cooling_metric",
    unit: "kWh/h",
    steps: [40, 150, 280, 460],
  },
  water: {
    label: "Water use",
    field: "water_metric",
    unit: "m3",
    steps: [2, 8, 16, 28],
  },
  pv: {
    label: "PV generation",
    field: "pv_metric",
    unit: "kWh/h",
    steps: [0, 15, 35, 70],
  },
  eui: {
    label: "Energy use intensity",
    field: "eui",
    unit: "kWh/m2-yr",
    steps: [100, 170, 240, 310],
  },
};

const colorModeConfig = {
  type: { label: "Building type" },
  eui: { label: "EUI 2023" },
  height: { label: "Building height" },
  live: { label: "Operational status" },
};

const focusBuildings = [
  { sourceId: "way/628774809", code: "SDE4", name: "SDE4" },
  { sourceId: "way/503403831", code: "Ventus", name: "Ventus" },
  { sourceId: "way/140079084", code: "SDE3", name: "SDE3" },
  { sourceId: "way/139974054", code: "E3A", name: "E3A" },
  { sourceId: "way/139957953", code: "T-LAB", name: "E5A / T-Lab" },
  { sourceId: "way/139959807", code: "E8", name: "E8" },
  { sourceId: "way/139959760", code: "E6", name: "E6" },
  { sourceId: "way/140078777", code: "SDE1", name: "SDE1" },
  { sourceId: "way/140078560", code: "SDE2", name: "SDE2" },
  { sourceId: "relation/15780831", code: "COM3", name: "COM3" },
  { sourceId: "way/141905556", code: "S1A", name: "Lee Wee Kheng Building (S1A/LT 32)" },
  { sourceId: "way/141906130", code: "S9", name: "S9 - Wet Science Building" },
  { sourceId: "way/141913023", code: "CELS", name: "Centre for Life Sciences" },
  { sourceId: "way/141912739", code: "MD1", name: "MD1 - Tahir Foundation Building" },
  { sourceId: "way/141912951", code: "MD2", name: "MD2" },
  { sourceId: "way/141912974", code: "MD6", name: "MD6" },
];

const focusBuildingBySourceId = new Map(focusBuildings.map((building) => [building.sourceId, building]));
const focusSourceIdSet = new Set(focusBuildings.map((building) => building.sourceId));
const priorityBuildingCodes = new Set(focusBuildings.map((building) => building.code));

const focusRegions = [
  {
    id: "design-engineering",
    label: "Design and Engineering",
    codes: ["SDE4", "Ventus", "SDE3", "E3A", "T-LAB", "E8", "E6", "SDE1", "SDE2"],
    color: "#1f5fbf",
  },
  {
    id: "computing",
    label: "Computing",
    codes: ["COM3"],
    color: "#287c6f",
  },
  {
    id: "science",
    label: "Science",
    codes: ["S1A", "S9"],
    color: "#7c3aed",
  },
  {
    id: "medicine",
    label: "Medicine",
    codes: ["CELS", "MD1", "MD2", "MD6"],
    color: "#db2777",
  },
];

const state = {
  map: null,
  data: null,
  displayFeatures: [],
  pointData: null,
  zoneData: null,
  regionAreaData: null,
  sourceFeatureById: new Map(),
  displayFeatureBySourceId: new Map(),
  metric: "live",
  selectedId: null,
  activeTab: "overview",
  activeExternalDataset: "electricity-consumption",
  externalPanelOpen: false,
  externalData: {},
  searchTerm: "",
  realtimeByBuilding: {},
  historyCache: new Map(),
  aiHealthCache: null,
  aiHealthLoading: false,
  aiAgentMessages: [],
  activeRealtimeBuilding: "SDE4",
  activeHistoryKey: "electricity",
  activeBrickBuilding: "SDE4",
  activeBrickNodeId: "sde4",
  activeMapboxToken: "",
  activeMapboxTokenSource: "default",
  mapAuthFallbackInProgress: false,
  refreshTimer: null,
};

window.__nusCampusEmis = state;

const els = {
  tokenPanel: document.getElementById("tokenPanel"),
  tokenForm: document.getElementById("tokenForm"),
  tokenInput: document.getElementById("tokenInput"),
  tokenError: document.getElementById("tokenError"),
  resetToken: document.getElementById("resetToken"),
  campusView: document.getElementById("campusView"),
  mapRealtimeView: document.getElementById("mapRealtimeView"),
  mapBrickView: document.getElementById("mapBrickView"),
  realtimeStatusDot: document.getElementById("realtimeStatusDot"),
  realtimeStatusText: document.getElementById("realtimeStatusText"),
  tabButtons: document.querySelectorAll("[data-tab]"),
  tabPanels: document.querySelectorAll("[data-tab-panel]"),
  metricButtons: document.querySelectorAll("[data-metric]"),
  toggleBuildings: document.getElementById("toggleBuildings"),
  toggleLabels: document.getElementById("toggleLabels"),
  togglePv: document.getElementById("togglePv"),
  toggleEuiLayer: document.getElementById("toggleEuiLayer"),
  buildingSearch: document.getElementById("buildingSearch"),
  buildingList: document.getElementById("buildingList"),
  summaryElectricity: document.getElementById("summaryElectricity"),
  summaryCooling: document.getElementById("summaryCooling"),
  summaryWater: document.getElementById("summaryWater"),
  summaryPv: document.getElementById("summaryPv"),
  overviewCoverage: document.getElementById("overviewCoverage"),
  regionList: document.getElementById("regionList"),
  aiBriefList: document.getElementById("aiBriefList"),
  aiInsightList: document.getElementById("aiInsightList"),
  aiHealthRefresh: document.getElementById("aiHealthRefresh"),
  aiHealthKpis: document.getElementById("aiHealthKpis"),
  aiClusterMeta: document.getElementById("aiClusterMeta"),
  aiClusterChart: document.getElementById("aiClusterChart"),
  aiRegimeTimeline: document.getElementById("aiRegimeTimeline"),
  aiLlmSummary: document.getElementById("aiLlmSummary"),
  aiAgentStatus: document.getElementById("aiAgentStatus"),
  aiAgentMessages: document.getElementById("aiAgentMessages"),
  aiAgentSuggestions: document.getElementById("aiAgentSuggestions"),
  aiAgentPromptForm: document.getElementById("aiAgentPromptForm"),
  aiAgentPromptInput: document.getElementById("aiAgentPromptInput"),
  externalDataButtons: document.querySelectorAll("[data-external]"),
  externalContextPanel: document.getElementById("externalContextPanel"),
  externalContextClose: document.getElementById("externalContextClose"),
  externalVizPanel: document.getElementById("externalVizPanel"),
  buildingZone: document.getElementById("buildingZone"),
  buildingName: document.getElementById("buildingName"),
  buildingStatus: document.getElementById("buildingStatus"),
  buildingBlocks: document.getElementById("buildingBlocks"),
  buildingElectricity: document.getElementById("buildingElectricity"),
  buildingCooling: document.getElementById("buildingCooling"),
  buildingWater: document.getElementById("buildingWater"),
  buildingPv: document.getElementById("buildingPv"),
  buildingEui: document.getElementById("buildingEui"),
  buildingUpdated: document.getElementById("buildingUpdated"),
  buildingInsight: document.getElementById("buildingInsight"),
  zoomSelected: document.getElementById("zoomSelected"),
  realtimeTrends: document.getElementById("realtimeTrends"),
  trendView: document.getElementById("trendView"),
  trendSummary: document.getElementById("trendSummary"),
  trendNote: document.getElementById("trendNote"),
  pointCount: document.getElementById("pointCount"),
  pointList: document.getElementById("pointList"),
  trendModal: document.getElementById("trendModal"),
  trendClose: document.getElementById("trendClose"),
  trendModalEyebrow: document.getElementById("trendModalEyebrow"),
  trendModalTitle: document.getElementById("trendModalTitle"),
  trendModalSubtitle: document.getElementById("trendModalSubtitle"),
  trendPlaceSelect: document.getElementById("trendPlaceSelect"),
  trendPlaceMeta: document.getElementById("trendPlaceMeta"),
  trendLiveMeters: document.getElementById("trendLiveMeters"),
  trendTabs: document.getElementById("trendTabs"),
  trendStatus: document.getElementById("trendStatus"),
  trendKpis: document.getElementById("trendKpis"),
  trendChart: document.getElementById("trendChart"),
  trendNarrative: document.getElementById("trendNarrative"),
  brickModal: document.getElementById("brickModal"),
  brickClose: document.getElementById("brickClose"),
  brickModalEyebrow: document.getElementById("brickModalEyebrow"),
  brickModalTitle: document.getElementById("brickModalTitle"),
  brickModalSubtitle: document.getElementById("brickModalSubtitle"),
  brickPlaceSelect: document.getElementById("brickPlaceSelect"),
  brickPlaceMeta: document.getElementById("brickPlaceMeta"),
  brickSummary: document.getElementById("brickSummary"),
  brickGraph: document.getElementById("brickGraph"),
  brickRelations: document.getElementById("brickRelations"),
  brickInspector: document.getElementById("brickInspector"),
  legendTitle: document.getElementById("legendTitle"),
  legendItems: document.getElementById("legendItems"),
  legendScale: document.getElementById("legendScale"),
  legendLabels: document.getElementById("legendLabels"),
};

function getInitialMapboxToken() {
  const urlToken = new URLSearchParams(window.location.search).get("mapbox_token");
  if (urlToken) {
    localStorage.setItem("nus-emis-mapbox-token", urlToken);
    return { token: urlToken, source: "url" };
  }
  const savedToken = localStorage.getItem("nus-emis-mapbox-token");
  if (savedToken) return { token: savedToken, source: "stored" };
  if (defaultMapboxPublicToken) return { token: defaultMapboxPublicToken, source: "default" };
  return { token: "", source: "missing" };
}

function isDefaultMapboxToken(token) {
  return Boolean(defaultMapboxPublicToken) && token === defaultMapboxPublicToken;
}

function setTokenError(message = "") {
  if (!els.tokenError) return;
  els.tokenError.textContent = message;
  els.tokenError.classList.toggle("hidden", !message);
}

function showTokenPanel(message = "") {
  setTokenError(message);
  els.tokenPanel.classList.remove("hidden");
}

function hideTokenPanel() {
  setTokenError("");
  els.tokenPanel.classList.add("hidden");
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || value === "") return "-";
  if (!Number.isFinite(Number(value))) return "-";
  return new Intl.NumberFormat("en-SG", { maximumFractionDigits: digits }).format(Number(value));
}

function formatMetric(value, unit, digits = 1) {
  if (value === null || value === undefined || value === "") return "No data";
  if (!Number.isFinite(Number(value))) return "No data";
  return `${formatNumber(value, digits)} ${unit}`;
}

function formatPvMetric(value, unit = "kW", digits = 2) {
  return formatMetric(value, unit, digits);
}

function formatLivePvMetric(value) {
  return formatMetric(value, "kWh/h", 1);
}

function formatTimestamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setRealtimeStatus(status, text) {
  els.realtimeStatusDot.className = `status-dot ${status}`;
  els.realtimeStatusText.textContent = text;
}

function metricValueExpression(metric) {
  return ["to-number", ["get", metricConfig[metric].field], 0];
}

function colorExpression(metric) {
  const steps = metricConfig[metric].steps;
  if (metric === "pv") {
    return [
      "interpolate",
      ["linear"],
      metricValueExpression(metric),
      steps[0],
      "#e8eef3",
      steps[1],
      "#f6c766",
      steps[2],
      "#ef7c00",
      steps[3],
      "#9d4b00",
    ];
  }
  if (metric === "water") {
    return [
      "interpolate",
      ["linear"],
      metricValueExpression(metric),
      steps[0],
      "#edf4fa",
      steps[1],
      "#8dbfdf",
      steps[2],
      "#3f83b8",
      steps[3],
      "#14527e",
    ];
  }
  return [
    "interpolate",
    ["linear"],
    metricValueExpression(metric),
    steps[0],
    "#dcefee",
    steps[1],
    "#72b7b2",
    steps[2],
    "#e5aa49",
    steps[3],
    "#b43b34",
  ];
}

function buildingModelColorExpression() {
  return [
    "match",
    ["get", "building_type"],
    ["ihl", "non_ihl", "institutional", "education", "school", "university"],
    "#4b6edb",
    ["public_service", "hospital", "clinic", "healthcare"],
    "#b43b34",
    ["retail", "commercial", "mixed_development", "business_park", "office"],
    "#df7a2f",
    ["private_apartment", "residential", "hdb", "condominium", "landed_property"],
    "#3b8f65",
    ["sports", "recreation", "community_cultural"],
    "#2f9ab7",
    ["industrial", "utility", "warehouse"],
    "#7357b8",
    "#7aa6b8",
  ];
}

function euiColorExpression() {
  return [
    "interpolate",
    ["linear"],
    ["to-number", ["get", "eui_2023"], 0],
    80,
    "#dcefee",
    160,
    "#72b7b2",
    260,
    "#e5aa49",
    380,
    "#b43b34",
  ];
}

function heightColorExpression() {
  return [
    "interpolate",
    ["linear"],
    ["to-number", ["get", "height_m"], 0],
    4,
    "#dcefee",
    20,
    "#72b7b2",
    50,
    "#e5aa49",
    90,
    "#b43b34",
  ];
}

function liveMappingColorExpression() {
  const liveSourceIds = (state.data?.features || [])
    .filter((feature) => feature.properties.has_realtime)
    .map((feature) => feature.properties.source_id)
    .filter(Boolean);
  if (!liveSourceIds.length) return "#6f8d9c";
  return ["match", ["get", "source_id"], liveSourceIds, "#003d7c", "#6f8d9c"];
}

function statusClass(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "";
  if (value >= 0.7) return "warning";
  if (value <= 0.35) return "good";
  return "";
}

function statusText(score, hasLiveData = false) {
  if (hasLiveData) return "Live";
  const value = Number(score);
  if (!Number.isFinite(value)) return "Catalogued";
  if (value >= 0.7) return "Flag";
  if (value <= 0.35) return "Normal";
  return "Watch";
}

function buildingStatusColorExpression() {
  return [
    "case",
    ["==", ["get", "has_realtime"], true],
    "#003d7c",
    [">=", ["to-number", ["get", "anomaly_score"], 0], 0.7],
    "#b43b34",
    [">=", ["to-number", ["get", "anomaly_score"], 0], 0.45],
    "#e5aa49",
    "#287c6f",
  ];
}

function featureCenter(feature) {
  if (feature.geometry.type === "Point") return feature.geometry.coordinates;
  const ring = feature.geometry.coordinates[0];
  const bounds = ring.reduce(
    (box, coordinate) => box.extend(coordinate),
    new mapboxgl.LngLatBounds(ring[0], ring[0]),
  );
  return bounds.getCenter().toArray();
}

function campusBoundaryFeature() {
  const [[west, south], [east, north]] = campusBounds;
  return {
    type: "Feature",
    properties: { name: "NUS campus focus area" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  };
}

function campusSourceIds() {
  const catalogIds = (state.data?.features || [])
    .map((feature) => feature.properties.source_id)
    .filter(Boolean);
  const ids = catalogIds.length ? catalogIds : focusBuildings.map((building) => building.sourceId);
  return Array.from(new Set(ids));
}

function campusSourceFilter() {
  const ids = campusSourceIds();
  if (!ids.length) return ["==", ["get", "source_id"], ""];
  return ["match", ["get", "source_id"], ids, true, false];
}

function campusFocusBounds() {
  const features = state.pointData?.features || [];
  if (!features.length) return new mapboxgl.LngLatBounds(campusBounds[0], campusBounds[1]);
  return features.reduce(
    (bounds, feature) => bounds.extend(feature.geometry.coordinates),
    new mapboxgl.LngLatBounds(features[0].geometry.coordinates, features[0].geometry.coordinates),
  );
}

function catalogFeatureBySourceId(sourceId) {
  return state.sourceFeatureById.get(String(sourceId || ""));
}

function displayFeatureBySourceId(sourceId) {
  return state.displayFeatureBySourceId.get(String(sourceId || ""));
}

function mergeCatalogAndMapbox(catalogFeature, mapboxProps = {}) {
  if (!catalogFeature) return null;
  return {
    ...catalogFeature,
    properties: {
      ...catalogFeature.properties,
      mapbox_building_type: mapboxProps.building_type || "",
      mapbox_height_m: mapboxProps.height_m ?? null,
      mapbox_eui_2023: mapboxProps.eui_2023 ?? null,
      mapbox_gfa_m2: mapboxProps.gfa_m2 ?? null,
      mapbox_footprint_m2: mapboxProps.footprint_m2 ?? null,
    },
  };
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function groupShortName(groupName, fallbackShortName) {
  const lookup = new Map([
    ["Kent Ridge Hall", "KRH"],
    ["Sheares Hall", "SH"],
    ["Temasek Hall", "TH"],
    ["Raffles Hall", "RH"],
    ["Eusoff Hall", "EH"],
    ["King Edward VII Hall", "KEVII"],
    ["Ridge View Residential College", "RVRC"],
    ["PGP Residence 1", "PGP1"],
    ["PGP Residence 2", "PGP2"],
    ["PGP Residence 3", "PGP3"],
    ["PGR Graduate Student", "PGR"],
    ["Helix House", "HH"],
    ["Pioneer House", "PH"],
    ["LightHouse", "LH"],
    ["Cendana College", "Cendana"],
    ["Elm College", "Elm"],
    ["Saga College", "Saga"],
    ["UTown Residence", "UTR"],
    ["University Hall", "UHALL"],
    ["Greenhouse", "GH"],
  ]);
  return lookup.get(groupName) || fallbackShortName || groupName.slice(0, 10);
}

function compactMapLabel(groupName, shortName) {
  const lookup = new Map([
    ["Cendana College", "CEN"],
    ["Cinnamon College", "CIN"],
    ["Elm College", "ELM"],
    ["Saga College", "SAGA"],
    ["Yale-NUS College", "YNC"],
    ["College of Alice & Peter Tan", "CAPT"],
    ["Kent Ridge Guild House", "KRGH"],
    ["Stephen Riady Centre", "SRC"],
    ["Education Resource Centre", "ERC"],
    ["University Sports Centre", "USC"],
    ["University Health Centre", "UHC"],
    ["Central Library", "CLB"],
    ["Central Library Annexe", "CLBA"],
    ["Medicine + Science Library", "MSL"],
    ["Centre for Life Sciences", "CELS"],
    ["Centre for English Language Communication", "CELC"],
    ["Techno Edge", "TE"],
    ["Create Tower", "CRT"],
    ["Create", "CRT"],
    ["Ventus", "VEN"],
    ["Greenhouse", "GH"],
    ["King Edward VII Hall", "KE7"],
  ]);
  if (lookup.has(groupName)) return lookup.get(groupName);
  const value = String(shortName || groupName || "").replace(/\s+/g, "");
  if (value.length <= 4) return value;
  const letters = value.replace(/[^A-Za-z0-9]/g, "");
  return letters.length <= 4 ? letters : letters.slice(0, 4).toUpperCase();
}

function buildingGroupName(name) {
  const text = String(name || "").trim();
  const replacements = [
    [/^Sheares Block [A-Z].*/i, "Sheares Hall"],
    [/^Kent Ridge Hall Block [A-Z].*/i, "Kent Ridge Hall"],
    [/^Temasek Hall Block .*/i, "Temasek Hall"],
    [/^Raffles Hall Block .*/i, "Raffles Hall"],
    [/^Raffles Hall \(Block .*/i, "Raffles Hall"],
    [/^Eusoff Hall Block .*/i, "Eusoff Hall"],
    [/^King Edward VII Hall Block .*/i, "King Edward VII Hall"],
    [/^King Edward VII Hall Communal Hall.*/i, "King Edward VII Hall"],
    [/^Ridge View Residential College Block .*/i, "Ridge View Residential College"],
    [/^PGP Residence 1 Block .*/i, "PGP Residence 1"],
    [/^PGP Residence 2 Block .*/i, "PGP Residence 2"],
    [/^PGP Residence 3 Block .*/i, "PGP Residence 3"],
    [/^PGR Graduate Student Block .*/i, "PGR Graduate Student"],
    [/^Helix House Block .*/i, "Helix House"],
    [/^Pioneer House Block .*/i, "Pioneer House"],
    [/^LightHouse Block .*/i, "LightHouse"],
    [/^UTown Residence (North|South) Tower.*/i, "UTown Residence"],
    [/^University Hall \(.*\)/i, "University Hall"],
  ];
  const matched = replacements.find(([pattern]) => pattern.test(text));
  if (matched) return matched[1];
  return text;
}

function buildingGroupKey(feature, groupName) {
  const knownParentGroups = new Set([
    "Kent Ridge Hall",
    "Sheares Hall",
    "Temasek Hall",
    "Raffles Hall",
    "Eusoff Hall",
    "King Edward VII Hall",
    "Ridge View Residential College",
    "PGP Residence 1",
    "PGP Residence 2",
    "PGP Residence 3",
    "PGR Graduate Student",
    "Helix House",
    "Pioneer House",
    "LightHouse",
    "UTown Residence",
    "University Hall",
  ]);
  if (knownParentGroups.has(groupName)) return `group-${slug(groupName)}`;
  return `group-${slug(groupName)}-${slug(feature.properties.zone)}`;
}

function childDisplayName(parentName, childName) {
  const name = String(childName || "");
  if (name === parentName) return "Main";
  if (parentName === "Sheares Hall") return name.replace(/^Sheares\s+/i, "");
  if (parentName === "PGR Graduate Student") return name.replace(/^PGR Graduate Student\s+/i, "");
  if (name.startsWith(parentName)) return name.slice(parentName.length).trim().replace(/^\(|\)$/g, "") || "Main";
  return name;
}

function firstFinite(values) {
  return values.map(Number).find(Number.isFinite) ?? null;
}

function sumFinite(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  return numeric.reduce((total, value) => total + value, 0);
}

function maxFinite(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  return Math.max(...numeric);
}

function averageFinite(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  return numeric.reduce((total, value) => total + value, 0) / numeric.length;
}

function representativeFeature(features, groupName) {
  return (
    features.find((feature) => feature.properties.name === groupName) ||
    features.find((feature) => !/Block/i.test(feature.properties.name || "")) ||
    features[0]
  );
}

function buildDisplayFeatures(features) {
  const groups = new Map();
  features.filter((feature) => focusSourceIdSet.has(feature.properties.source_id)).forEach((feature) => {
    const groupName = buildingGroupName(feature.properties.name);
    const key = buildingGroupKey(feature, groupName) || feature.properties.id;
    if (!groups.has(key)) groups.set(key, { groupName, features: [] });
    groups.get(key).features.push(feature);
  });

  return Array.from(groups.values()).map(({ groupName, features }) => {
    const representative = representativeFeature(features, groupName);
    const props = representative.properties;
    const focus = focusBuildingBySourceId.get(props.source_id);
    const displayName = focus?.name || groupName;
    const displayCode = focus?.code || groupShortName(groupName, props.short_name);
    const childLabels = features.map((feature) => childDisplayName(groupName, feature.properties.name));
    const distinctChildLabels = Array.from(new Set(childLabels)).filter(Boolean);
    const childSummary =
      features.length > 1 && distinctChildLabels.length === 1 && distinctChildLabels[0] === "Main"
        ? `${features.length} footprints`
        : distinctChildLabels.join(", ");
    const coordinates =
      features.length > 1 && !features.some((feature) => feature.properties.name === groupName)
        ? [
            averageFinite(features.map((feature) => feature.geometry.coordinates[0])),
            averageFinite(features.map((feature) => feature.geometry.coordinates[1])),
          ]
        : representative.geometry.coordinates;
    const sourceIds = features.map((feature) => feature.properties.source_id).filter(Boolean);
    const hasRealtime = features.some((feature) => feature.properties.has_realtime);
    const displayProps = {
      ...props,
      id: `display-${slug(displayCode) || props.id}`,
      name: displayName,
      short_name: displayCode,
      source_id: props.source_id,
      source_ids: sourceIds.join(","),
      child_count: features.length,
      child_names: features.map((feature) => feature.properties.name).join("; "),
      child_summary: childSummary,
      has_realtime: hasRealtime,
      area_m2: sumFinite(features.map((feature) => feature.properties.area_m2)),
      load_kw: sumFinite(features.map((feature) => feature.properties.load_kw)),
      cooling_kw: sumFinite(features.map((feature) => feature.properties.cooling_kw)),
      water_m3_today: sumFinite(features.map((feature) => feature.properties.water_m3_today)),
      solar_kw: sumFinite(features.map((feature) => feature.properties.solar_kw)),
      eui: averageFinite(features.map((feature) => feature.properties.eui)),
      anomaly_score: maxFinite(features.map((feature) => feature.properties.anomaly_score)),
      forecast_peak_kw: sumFinite(features.map((feature) => feature.properties.forecast_peak_kw)),
      grouped_marker: features.length > 1,
      ai_summary:
        features.length > 1
          ? `${displayName} contains ${features.length} mapped footprints.`
          : props.ai_summary,
      suggested_action:
        features.length > 1
          ? `Block details are listed in the building tab: ${childSummary}.`
          : props.suggested_action,
    };
    displayProps.map_label = displayCode;

    return {
      type: "Feature",
      properties: {
        ...displayProps,
        label_priority: isPriorityBuilding(displayProps),
        label_rank: labelRank(displayProps),
      },
      geometry: {
        type: "Point",
        coordinates,
      },
    };
  });
}

function isPriorityBuilding(props) {
  const shortName = String(props.short_name || "");
  if (props.has_realtime) return true;
  if (priorityBuildingCodes.has(shortName)) return true;
  return /Central Library|University Sports Centre|Stephen Riady Centre|University Health Centre|Yusof Ishak House/i.test(
    props.name || "",
  );
}

function labelRank(props) {
  if (props.has_realtime) return 0;
  if (priorityBuildingCodes.has(String(props.short_name || ""))) return 1;
  if (props.has_model_assets) return 2;
  return 5;
}

function featuresForRegionCodes(codes, features = state.displayFeatures) {
  const codeSet = new Set(codes.map((code) => String(code || "")));
  return (features || []).filter((feature) => codeSet.has(String(feature.properties.short_name || "")));
}

function buildZonePointData(features) {
  return {
    type: "FeatureCollection",
    features: focusRegions.map((region) => {
      const regionFeatures = featuresForRegionCodes(region.codes, features);
      const count = regionFeatures.length || region.codes.length;
      const coordinates =
        regionFeatures.length > 0
          ? regionFeatures.reduce(
              (sum, feature) => {
                sum[0] += Number(feature.geometry.coordinates[0]);
                sum[1] += Number(feature.geometry.coordinates[1]);
                return sum;
              },
              [0, 0],
            ).map((value) => value / regionFeatures.length)
          : null;
      const fallbackCenter = features.reduce(
        (sum, feature) => {
          sum[0] += Number(feature.geometry.coordinates[0]);
          sum[1] += Number(feature.geometry.coordinates[1]);
          return sum;
        },
        [0, 0],
      );
      const center = coordinates || [
        fallbackCenter[0] / Math.max(features.length, 1),
        fallbackCenter[1] / Math.max(features.length, 1),
      ];
      return {
        type: "Feature",
        properties: {
          id: region.id,
          zone: region.label,
          count,
          codes: region.codes.join(","),
          label: `${region.label} (${count})`,
          color: region.color,
        },
        geometry: {
          type: "Point",
          coordinates: center,
        },
      };
    }),
  };
}

function ellipsePolygon(center, radiusLng, radiusLat, steps = 72) {
  const coordinates = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = (Math.PI * 2 * index) / steps;
    coordinates.push([center[0] + Math.cos(angle) * radiusLng, center[1] + Math.sin(angle) * radiusLat]);
  }
  return coordinates;
}

function buildRegionAreaData(features) {
  return {
    type: "FeatureCollection",
    features: focusRegions
      .map((region) => {
        const regionFeatures = featuresForRegionCodes(region.codes, features);
        if (!regionFeatures.length) return null;
        const lngs = regionFeatures.map((feature) => Number(feature.geometry.coordinates[0])).filter(Number.isFinite);
        const lats = regionFeatures.map((feature) => Number(feature.geometry.coordinates[1])).filter(Number.isFinite);
        if (!lngs.length || !lats.length) return null;
        const west = Math.min(...lngs);
        const east = Math.max(...lngs);
        const south = Math.min(...lats);
        const north = Math.max(...lats);
        const center = [(west + east) / 2, (south + north) / 2];
        const radiusLng = Math.max((east - west) / 2 + 0.0005, 0.00115);
        const radiusLat = Math.max((north - south) / 2 + 0.00045, 0.00085);
        return {
          type: "Feature",
          properties: {
            id: `${region.id}-area`,
            label: region.label,
            count: regionFeatures.length,
            color: region.color,
          },
          geometry: {
            type: "Polygon",
            coordinates: [ellipsePolygon(center, radiusLng, radiusLat)],
          },
        };
      })
      .filter(Boolean),
  };
}

function normalizeRealtimePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.value)) return payload.value;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function average(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function sum(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  return numeric.reduce((total, value) => total + value, 0);
}

function classifyRealtimePoints(points) {
  const byName = (pattern) => points.filter((item) => pattern.test(item.point || ""));
  const allElectricity = byName(/Calculated Building Electrical Consumption|Electrical.*Consumption|Power_Meters/i);
  const allCooling = byName(/Total Cooling Hourly Consumption|BTU|Cooling/i);
  const allWater = byName(/Water|Volume/i);
  const pvAll = byName(/Act_E-Recv_.*_ALL_Hourly_kWh/i);
  const pvComponents = byName(/Act_E-Recv_.*_M[12]_Hourly_kWh/i);
  const pvInverterPower = byName(/PV_System.*Total_kW|PV/i);
  const temp = byName(/Temperature$/i);
  const humidity = byName(/Humidity$/i);
  const co2 = byName(/CO2$/i);
  const airflow = byName(/Airflow$/i);
  const updateTime = points
    .map((item) => item.time)
    .filter(Boolean)
    .sort()
    .at(-1);

  const electricityAll = allElectricity.find((item) => /ALL_Hourly_kWh/i.test(item.point || ""));
  const electricityValue = electricityAll ? Number(electricityAll.value) : sum(allElectricity.map((item) => item.value));
  const coolingValue = sum(allCooling.map((item) => item.value));
  const waterValue = sum(allWater.map((item) => item.value));
  const pvAllPoint = pvAll[0];
  const pvGeneration = pvAllPoint ? Number(pvAllPoint.value) : sum(pvComponents.map((item) => item.value));

  return {
    points,
    updateTime,
    electricityHourlyKwh: Number.isFinite(electricityValue) ? electricityValue : null,
    coolingHourlyKwh: Number.isFinite(coolingValue) ? coolingValue : null,
    waterM3: Number.isFinite(waterValue) ? waterValue : null,
    pvKw: Number.isFinite(pvGeneration) ? pvGeneration : null,
    pvUnit: "kWh/h",
    pvPrimaryPoint: pvAllPoint || null,
    electricityPoints: allElectricity,
    coolingPoints: allCooling,
    waterPoints: allWater,
    pvPoints: pvAllPoint ? [pvAllPoint] : pvComponents,
    pvComponentPoints: pvComponents,
    pvInverterPowerPoints: pvInverterPower,
    indoorTemperatureC: average(temp.map((item) => item.value)),
    indoorHumidityPct: average(humidity.map((item) => item.value)),
    indoorCo2Ppm: average(co2.map((item) => item.value)),
    airflow: sum(airflow.map((item) => item.value)),
  };
}

function applyRealtimeToFeature(feature) {
  const props = feature.properties;
  const live = state.realtimeByBuilding[props.short_name] || state.realtimeByBuilding[props.id?.toUpperCase()];
  props.has_realtime = Boolean(live);
  props.electricity_metric = live?.electricityHourlyKwh ?? props.load_kw ?? 0;
  props.cooling_metric = live?.coolingHourlyKwh ?? props.cooling_kw ?? 0;
  props.water_metric = live?.waterM3 ?? props.water_m3_today ?? 0;
  props.pv_metric = live?.pvKw ?? props.solar_kw ?? 0;
  props.latest_update = live?.updateTime || "";
  props.live_temperature_c = live?.indoorTemperatureC ?? null;
  props.live_humidity_pct = live?.indoorHumidityPct ?? null;
  props.live_co2_ppm = live?.indoorCo2Ppm ?? null;
  props.live_airflow = live?.airflow ?? null;
  return feature;
}

function refreshDerivedData() {
  state.data.features = state.data.features.map(applyRealtimeToFeature);
  state.sourceFeatureById = new Map(
    state.data.features
      .map((feature) => [feature.properties.source_id, feature])
      .filter(([sourceId]) => Boolean(sourceId)),
  );
  state.displayFeatures = buildDisplayFeatures(state.data.features);
  state.displayFeatureBySourceId = new Map();
  state.displayFeatures.forEach((feature) => {
    String(feature.properties.source_ids || feature.properties.source_id || "")
      .split(",")
      .filter(Boolean)
      .forEach((sourceId) => state.displayFeatureBySourceId.set(sourceId, feature));
  });
  state.pointData = {
    type: "FeatureCollection",
    features: state.displayFeatures.map((feature) => ({
      type: "Feature",
      properties: {
        ...feature.properties,
        label_priority: isPriorityBuilding(feature.properties),
        label_rank: labelRank(feature.properties),
      },
      geometry: {
        type: "Point",
        coordinates: featureCenter(feature),
      },
    })),
  };
  state.zoneData = buildZonePointData(state.displayFeatures);
  state.regionAreaData = buildRegionAreaData(state.displayFeatures);
}

async function loadRealtime() {
  setRealtimeStatus("", "Realtime API loading");
  const results = await Promise.allSettled(
    realtimeConfig.liveBuildings.map(async (building) => {
      const response = await fetch(`${realtimeConfig.baseUrl}?building=${encodeURIComponent(building)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`${building}: HTTP ${response.status}`);
      const payload = await response.json();
      return [building, classifyRealtimePoints(normalizeRealtimePayload(payload))];
    }),
  );

  let liveCount = 0;
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const [building, classified] = result.value;
      state.realtimeByBuilding[building] = classified;
      liveCount += 1;
    }
  });

  if (liveCount > 0) setRealtimeStatus("live", `${liveCount} building live`);
  else setRealtimeStatus("error", "Realtime API unavailable");

  refreshDerivedData();
  updateMapData();
  updateSummary();
  if (!els.trendModal?.classList.contains("hidden")) renderTrendLiveMeters();
  if (!els.brickModal?.classList.contains("hidden")) renderBrickGraph();
  renderBuildingList();
  if (state.selectedId) {
    const selected = state.displayFeatures.find((feature) => feature.properties.id === state.selectedId);
    if (selected) selectBuilding(selected);
  }
}

function updateMapData() {
  if (!state.map) return;
  if (state.map.getSource("building-points")) state.map.getSource("building-points").setData(state.pointData);
  if (state.map.getSource("zone-points")) state.map.getSource("zone-points").setData(state.zoneData);
  if (state.map.getSource("region-areas")) state.map.getSource("region-areas").setData(state.regionAreaData);
}

async function loadData() {
  let response = await fetch("data/processed/nus-campus-buildings.geojson");
  if (!response.ok) response = await fetch("data/processed/nus-campus-buildings.sample.geojson");
  if (!response.ok) throw new Error("Unable to load campus building registry GeoJSON.");
  state.data = await response.json();
  await loadExternalData();
  refreshDerivedData();
  updateSummary();
  renderBuildingList();
  renderExternalDataPanel(state.activeExternalDataset, { open: false });
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

async function loadExternalData() {
  const [electricity, systemDemand, solarPv] = await Promise.all([
    loadJson("data/external/ema/electricity-annual.json"),
    loadJson("data/external/ema/system-demand-context.json"),
    loadJson("data/external/ema/solar-pv-regional.json"),
  ]);
  state.externalData = {
    "electricity-consumption": electricity,
    "system-demand": systemDemand,
    "solar-pv-deployment": solarPv,
  };
}

function visibleFeatures() {
  if (!state.displayFeatures) return [];
  const search = state.searchTerm.toLowerCase();
  return state.displayFeatures.filter((feature) => {
    const props = feature.properties;
    const name = String(props.name || "").toLowerCase();
    const shortName = String(props.short_name || "").toLowerCase();
    const zone = String(props.zone || "").toLowerCase();
    const type = String(props.type || "").toLowerCase();
    const childNames = String(props.child_names || "").toLowerCase();
    return (
      !search ||
      name.includes(search) ||
      shortName.includes(search) ||
      zone.includes(search) ||
      type.includes(search) ||
      childNames.includes(search)
    );
  });
}

function liveBuildingCodes() {
  return Object.keys(state.realtimeByBuilding).filter((code) => state.realtimeByBuilding[code]);
}

function sumLiveMetric(accessor) {
  const values = liveBuildingCodes()
    .map((code) => accessor(state.realtimeByBuilding[code], code))
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => Number(value))
    .filter(Number.isFinite);
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0);
}

function liveCoverageText() {
  const liveCodes = liveBuildingCodes();
  const liveCount = liveCodes.length;
  if (!liveCount) return "No live endpoints";
  if (liveCount === 1) return `${liveCodes[0]} live source • 1/${focusBuildings.length} buildings`;
  return `${liveCount}/${focusBuildings.length} buildings live`;
}

function updateSummary() {
  const electricity = sumLiveMetric((live) => live.electricityHourlyKwh);
  const cooling = sumLiveMetric((live) => live.coolingHourlyKwh);
  const water = sumLiveMetric((live) => live.waterM3);
  const pv = sumLiveMetric((live) => live.pvKw);
  if (els.overviewCoverage) els.overviewCoverage.textContent = liveCoverageText();
  els.summaryElectricity.textContent = electricity === null ? "No data" : formatMetric(electricity, "kWh/h", 1);
  els.summaryCooling.textContent = cooling === null ? "-" : formatMetric(cooling, "kWh/h", 1);
  els.summaryWater.textContent = water === null ? "Pending" : formatMetric(water, "m3", 1);
  els.summaryPv.textContent = pv === null ? "-" : formatLivePvMetric(pv);
  renderAiInsights();
  renderRegionList();
}

function activateTab(tabName) {
  state.activeTab = tabName;
  els.tabButtons.forEach((button) => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });
  if (tabName === "context") {
    renderExternalDataPanel(state.activeExternalDataset, { open: true });
  }
  if (tabName === "ai") {
    renderAiHealthMonitor();
  }
}

function zoomToRegionCodes(codes) {
  const regionFeatures = featuresForRegionCodes(codes);
  if (!regionFeatures.length || !state.map) return;
  const zoneBounds = regionFeatures.reduce(
    (bounds, item) => bounds.extend(item.geometry.coordinates),
    new mapboxgl.LngLatBounds(regionFeatures[0].geometry.coordinates, regionFeatures[0].geometry.coordinates),
  );
  state.map.fitBounds(zoneBounds, {
    padding: { top: 100, right: 120, bottom: 100, left: 120 },
    maxZoom: 17.1,
    pitch: 52,
    bearing: -24,
    duration: 700,
  });
}

function renderRegionList() {
  if (!els.regionList) return;
  els.regionList.innerHTML = "";
  focusRegions.forEach((region) => {
    const features = featuresForRegionCodes(region.codes);
    const liveCount = features.filter((feature) => feature.properties.has_realtime).length;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "region-card";
    card.innerHTML = `
      <span style="--region-color:${region.color}">${features.length || region.codes.length}</span>
      <div>
        <strong>${region.label}</strong>
        <small>${region.codes.join(", ")}</small>
      </div>
      <em>${liveCount} live</em>
    `;
    card.addEventListener("click", () => zoomToRegionCodes(region.codes));
    els.regionList.appendChild(card);
  });
}

function aiInsightItems() {
  const liveCodes = liveBuildingCodes();
  const liveCount = liveCodes.length;
  const liveList = liveCodes.length ? liveCodes.join(", ") : "none";
  const waterMappedCodes = liveCodes.filter((code) => {
    const value = state.realtimeByBuilding[code]?.waterM3;
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  });
  const liveCooling = sumLiveMetric((live) => live.coolingHourlyKwh);
  const livePv = sumLiveMetric((live) => live.pvKw);
  const items = [
    {
      severity: liveCount ? "normal" : "warning",
      title: `${liveCount} of ${focusBuildings.length} focus buildings live`,
      evidence: `Current public realtime coverage includes: ${liveList}.`,
      action: "Use the PI Web API point discovery workflow to map additional building codes before campus-wide AI fault detection.",
      confidence: "High",
    },
  ];

  if (liveCount) {
    items.push({
      severity: waterMappedCodes.length ? "normal" : "warning",
      title: waterMappedCodes.length ? "Water stream is mapped for live buildings" : "Water PI points are not mapped to public realtime yet",
      evidence: waterMappedCodes.length
        ? `Water values are available for: ${waterMappedCodes.join(", ")}.`
        : `Live buildings without public water values: ${liveCodes.join(", ")}.`,
      action: "Validate main potable, NEWater, and submeter candidates in PI before exposing a water metric through the API.",
      confidence: "High",
    });
    items.push({
      severity: "normal",
      title: "Live cooling and PV generation streams are partially mapped",
      evidence: `Coverage ${liveList}; cooling ${formatMetric(liveCooling, "kWh/h", 1)}; PV generation ${formatLivePvMetric(livePv)}.`,
      action: "Use the ALL hourly PV generation point as the primary series; keep M1 and M2 for meter-level breakdown.",
      confidence: "Medium",
    });
  }

  items.push({
    severity: "info",
    title: "EMA data should be used as external context",
    evidence: "EMA public data is national, market, sector, or planning-area level; it is not NUS building-level metering.",
    action: "Keep EMA datasets in a separate context layer for benchmarking, peak-period annotation, and policy baselines.",
    confidence: "High",
  });

  return items;
}

function renderAiInsights() {
  const items = aiInsightItems();
  const render = (target, limit = items.length) => {
    if (!target) return;
    target.innerHTML = items
      .slice(0, limit)
      .map(
        (item) => `
          <article class="ai-item ${item.severity}">
            <div>
              <strong>${item.title}</strong>
              <p>${item.evidence}</p>
              <small>${item.action}</small>
            </div>
            <span>${item.confidence}</span>
          </article>
        `,
      )
      .join("");
  };
  render(els.aiBriefList, 2);
  render(els.aiInsightList);
}

function aiClusterConfig(cluster) {
  const configs = {
    normal: {
      label: "Normal coupling",
      color: aiHealthConfig.clusterColors.normal,
      description: "Cooling tracks the current weather load within the expected band.",
    },
    weather: {
      label: "Weather-driven load",
      color: aiHealthConfig.clusterColors.weather,
      description: "High cooling coincides with high outdoor temperature or humidity.",
    },
    mildHigh: {
      label: "High cooling, mild weather",
      color: aiHealthConfig.clusterColors.mildHigh,
      description: "Cooling is high while weather load is moderate. This is the strongest health-monitoring candidate.",
    },
    afterHours: {
      label: "After-hours cooling",
      color: aiHealthConfig.clusterColors.afterHours,
      description: "Cooling is material during late evening, night, or weekend hours.",
    },
    standby: {
      label: "Low / standby",
      color: aiHealthConfig.clusterColors.standby,
      description: "Cooling is low relative to the recent SDE4 distribution.",
    },
  };
  return configs[cluster] || configs.normal;
}

function quantile(values, q) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function pearsonCorrelation(rows, xAccessor, yAccessor) {
  const pairs = rows
    .map((row) => [Number(xAccessor(row)), Number(yAccessor(row))])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return null;
  const meanX = average(pairs.map(([x]) => x));
  const meanY = average(pairs.map(([, y]) => y));
  const numerator = pairs.reduce((total, [x, y]) => total + (x - meanX) * (y - meanY), 0);
  const xDenominator = Math.sqrt(pairs.reduce((total, [x]) => total + (x - meanX) ** 2, 0));
  const yDenominator = Math.sqrt(pairs.reduce((total, [, y]) => total + (y - meanY) ** 2, 0));
  if (!xDenominator || !yDenominator) return null;
  return numerator / (xDenominator * yDenominator);
}

function linearFit(rows, xAccessor, yAccessor) {
  const pairs = rows
    .map((row) => [Number(xAccessor(row)), Number(yAccessor(row))])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return { slope: 0, intercept: average(pairs.map(([, y]) => y)) || 0 };
  const meanX = average(pairs.map(([x]) => x));
  const meanY = average(pairs.map(([, y]) => y));
  const denominator = pairs.reduce((total, [x]) => total + (x - meanX) ** 2, 0);
  if (!denominator) return { slope: 0, intercept: meanY };
  const slope = pairs.reduce((total, [x, y]) => total + (x - meanX) * (y - meanY), 0) / denominator;
  return { slope, intercept: meanY - slope * meanX };
}

function singaporeDateFromWeatherTime(value) {
  if (!value) return null;
  const localValue = value.includes("+") || value.endsWith("Z") ? value : `${value}:00+08:00`;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function weatherProxy(timestamp) {
  const date = new Date(timestamp + 8 * 60 * 60 * 1000);
  const hour = date.getUTCHours();
  const dayFactor = Math.sin(((hour - 8) / 24) * Math.PI * 2);
  const tempC = 28.1 + 2.4 * Math.max(0, dayFactor) + 0.5 * Math.sin((date.getUTCDate() / 31) * Math.PI * 2);
  const humidityPct = 78 - 12 * Math.max(0, dayFactor);
  return {
    tempC,
    humidityPct,
    source: "weather proxy",
  };
}

function weatherLoadIndex(tempC, humidityPct) {
  if (!Number.isFinite(tempC) || !Number.isFinite(humidityPct)) return null;
  return tempC + Math.max(0, humidityPct - 60) * 0.08;
}

async function loadWeatherRows() {
  const params = new URLSearchParams({
    latitude: String(aiHealthConfig.weather.latitude),
    longitude: String(aiHealthConfig.weather.longitude),
    hourly: "temperature_2m,relative_humidity_2m",
    past_days: "7",
    forecast_days: "1",
    timezone: "Asia/Singapore",
  });
  const response = await fetch(`${aiHealthConfig.weatherUrl}?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`weather HTTP ${response.status}`);
  const payload = await response.json();
  const times = payload?.hourly?.time || [];
  const temps = payload?.hourly?.temperature_2m || [];
  const humidity = payload?.hourly?.relative_humidity_2m || [];
  const rows = times
    .map((time, index) => {
      const date = singaporeDateFromWeatherTime(time);
      if (!date) return null;
      return {
        time,
        timestamp: date.getTime(),
        label: singaporeBucket(date, "hour").label,
        tempC: Number(temps[index]),
        humidityPct: Number(humidity[index]),
        source: "Open-Meteo",
      };
    })
    .filter((row) => row && Number.isFinite(row.tempC) && Number.isFinite(row.humidityPct));
  return new Map(rows.map((row) => [row.label, row]));
}

function classifyAiHealthRows(rows) {
  const coolingValues = rows.map((row) => row.coolingKwh).filter(Number.isFinite);
  const weatherValues = rows.map((row) => row.weatherIndex).filter(Number.isFinite);
  const q40 = quantile(coolingValues, 0.4) ?? 0;
  const q75 = quantile(coolingValues, 0.75) ?? q40;
  const q9 = quantile(coolingValues, 0.9) ?? q75;
  const weatherMedian = quantile(weatherValues, 0.5) ?? 0;
  const fit = linearFit(rows, (row) => row.weatherIndex, (row) => row.coolingKwh);
  const residuals = rows.map((row) => row.coolingKwh - (fit.intercept + fit.slope * row.weatherIndex));
  const residualQ9 = quantile(residuals.map(Math.abs), 0.9) || 1;

  return rows.map((row) => {
    const date = new Date(row.timestamp + 8 * 60 * 60 * 1000);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();
    const afterHours = hour < 7 || hour >= 20 || day === 0 || day === 6;
    const expected = fit.intercept + fit.slope * row.weatherIndex;
    const residual = row.coolingKwh - expected;
    let cluster = "normal";
    if (row.coolingKwh <= q40) cluster = "standby";
    else if (afterHours && row.coolingKwh >= q75) cluster = "afterHours";
    else if (row.coolingKwh >= q9 && row.weatherIndex <= weatherMedian + 0.4) cluster = "mildHigh";
    else if (row.coolingKwh >= q75 && row.weatherIndex > weatherMedian) cluster = "weather";
    const outlierScore = Math.max(0, Math.min(100, (residual / residualQ9) * 70));
    return {
      ...row,
      expectedCooling: expected,
      residual,
      cluster,
      outlierScore,
    };
  });
}

async function buildAiHealthModel(force = false) {
  if (state.aiHealthCache && !force) return state.aiHealthCache;
  const definition = historyPointByKey("cooling", aiHealthConfig.building);
  const rawCooling = await loadHistory(definition);
  const coolingRows = aggregateHistory(rawCooling, "hour").slice(-168);
  let weatherRows = new Map();
  let weatherSource = "weather proxy";
  try {
    weatherRows = await loadWeatherRows();
    weatherSource = "Open-Meteo";
  } catch (error) {
    console.warn("Weather context unavailable; using proxy.", error);
  }
  const rows = coolingRows.map((row) => {
    const weather = weatherRows.get(row.label) || weatherProxy(row.timestamp);
    return {
      timestamp: row.timestamp,
      label: row.label,
      coolingKwh: row.value,
      tempC: weather.tempC,
      humidityPct: weather.humidityPct,
      weatherIndex: weatherLoadIndex(weather.tempC, weather.humidityPct),
      sampleCount: row.count,
      weatherSource: weather.source,
    };
  }).filter((row) => Number.isFinite(row.coolingKwh) && Number.isFinite(row.weatherIndex));
  const classifiedRows = classifyAiHealthRows(rows);
  const current = classifiedRows.at(-1) || null;
  const clusterCounts = classifiedRows.reduce((counts, row) => {
    counts[row.cluster] = (counts[row.cluster] || 0) + 1;
    return counts;
  }, {});
  const coupling = pearsonCorrelation(classifiedRows, (row) => row.weatherIndex, (row) => row.coolingKwh);
  const model = {
    building: aiHealthConfig.building,
    rows: classifiedRows,
    current,
    clusterCounts,
    coupling,
    weatherSource,
    rawCoolingCount: rawCooling.length,
  };
  state.aiHealthCache = model;
  return model;
}

function couplingLabel(value) {
  if (!Number.isFinite(value)) return "Pending";
  const abs = Math.abs(value);
  if (abs >= 0.65) return "Strong";
  if (abs >= 0.35) return "Moderate";
  return "Weak";
}

function aiHealthClusterLabel(cluster) {
  return aiClusterConfig(cluster).label;
}

function renderAiHealthKpis(model) {
  if (!els.aiHealthKpis) return;
  const current = model.current;
  const currentCluster = current ? aiClusterConfig(current.cluster) : aiClusterConfig("normal");
  const outlierScore = current ? Math.round(current.outlierScore) : 0;
  const coolingValue = current ? formatMetric(current.coolingKwh, "kWh/h", 1) : "-";
  const weatherText = current ? `${formatNumber(current.tempC, 1)} degC / ${formatNumber(current.humidityPct, 0)}% RH` : "-";
  const rowsText = `${model.rows.length} hourly points`;
  els.aiHealthKpis.innerHTML = [
    ["Current regime", currentCluster.label, currentCluster.description],
    ["Cooling now", coolingValue, weatherText],
    ["Outlier score", `${outlierScore}/100`, "Residual against weather-normalized baseline"],
    ["Weather coupling", couplingLabel(model.coupling), `r = ${formatNumber(model.coupling, 2)} · ${model.weatherSource}`],
    ["Coverage", rowsText, `${model.rawCoolingCount.toLocaleString()} raw cooling samples`],
  ].map(([label, value, note]) => `
    <div class="ai-health-kpi">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </div>
  `).join("");
}

function focusRegionForCode(code) {
  return focusRegions.find((region) => region.codes.includes(code))?.label || "Focus building";
}

function renderAiClusterChart(model) {
  if (!els.aiClusterChart) return;
  const liveCodes = liveBuildingCodes();
  const currentConfig = model.current ? aiClusterConfig(model.current.cluster) : aiClusterConfig("normal");
  const rows = focusBuildings
    .map((building, index) => {
      const live = state.realtimeByBuilding[building.code];
      const isHealthBuilding = building.code === model.building;
      const status = live
        ? isHealthBuilding && model.current
          ? currentConfig.label
          : "Live endpoint mapped"
        : "Mapping pending";
      const value = live ? `${formatMetric(live.coolingHourlyKwh, "kWh/h", 1)} cooling` : "No public live endpoint";
      const note = live
        ? `${live.points.length} points · PV ${formatLivePvMetric(live.pvKw)} · updated ${formatTimestamp(live.updateTime)}`
        : `${focusRegionForCode(building.code)} · BAS channel mapping needed`;
      return {
        building,
        index,
        live,
        status,
        value,
        note,
        width: live ? 100 : 7,
        color: live ? (isHealthBuilding ? currentConfig.color : aiHealthConfig.clusterColors.normal) : "#cbd5df",
      };
    })
    .sort((a, b) => Number(Boolean(b.live)) - Number(Boolean(a.live)) || a.index - b.index);
  const liveCount = liveCodes.length;
  if (els.aiClusterMeta) els.aiClusterMeta.textContent = `${liveCount}/${focusBuildings.length} focus buildings live`;
  els.aiClusterChart.innerHTML = `
    <div class="ai-live-dashboard" role="list" aria-label="Focus building live health status">
      ${rows.map((row) => `
        <div class="ai-live-row ${row.live ? "is-live" : "is-pending"}" role="listitem">
          <div class="ai-live-name">
            <strong>${escapeHtml(row.building.code)}</strong>
            <span>${escapeHtml(row.building.name)}</span>
          </div>
          <div class="ai-live-track" title="${escapeHtml(row.note)}">
            <i style="--bar-width:${row.width}%; --bar-color:${row.color};"></i>
            <span>${escapeHtml(row.status)}</span>
          </div>
          <div class="ai-live-value">
            <strong>${escapeHtml(row.value)}</strong>
            <span>${escapeHtml(row.note)}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAiRegimeTimeline(model) {
  if (!els.aiRegimeTimeline) return;
  if (!model.rows.length) {
    els.aiRegimeTimeline.innerHTML = '<p class="empty-note">Diagnostic evidence is waiting for clustering output.</p>';
    return;
  }
  const total = model.rows.length || 1;
  const current = model.current;
  const currentConfig = current ? aiClusterConfig(current.cluster) : aiClusterConfig("normal");
  const clusters = ["normal", "weather", "mildHigh", "afterHours", "standby"];
  const rows = clusters.map((cluster) => {
    const config = aiClusterConfig(cluster);
    const count = model.clusterCounts[cluster] || 0;
    return {
      cluster,
      label: config.label,
      color: config.color,
      count,
      pct: Math.max(count ? 3 : 0, (count / total) * 100),
      description: config.description,
    };
  });
  els.aiRegimeTimeline.innerHTML = `
    <div class="ai-evidence-summary">
      <strong>${escapeHtml(currentConfig.label)}</strong>
      <span>${total} hourly samples · current score ${current ? Math.round(current.outlierScore) : 0}/100 · ${escapeHtml(model.weatherSource)}</span>
    </div>
    <div class="ai-evidence-bars" role="list" aria-label="SDE4 diagnostic evidence by regime">
      ${rows.map((row) => `
        <div class="ai-evidence-row ${current?.cluster === row.cluster ? "is-current" : ""}" role="listitem" title="${escapeHtml(row.description)}">
          <div class="ai-evidence-label">
            <i style="--cluster-color:${row.color};"></i>
            <span>${escapeHtml(row.label)}</span>
          </div>
          <div class="ai-evidence-track">
            <b style="--bar-width:${row.pct}%; --bar-color:${row.color};"></b>
          </div>
          <strong>${row.count} h</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAiLlmSummary(model) {
  if (!els.aiLlmSummary) return;
  const current = model.current;
  const currentConfig = current ? aiClusterConfig(current.cluster) : aiClusterConfig("normal");
  const mildHighCount = model.clusterCounts.mildHigh || 0;
  const afterHoursCount = model.clusterCounts.afterHours || 0;
  const weatherCount = model.clusterCounts.weather || 0;
  const outlierScore = current ? Math.round(current.outlierScore) : 0;
  const nextAction = current?.cluster === "mildHigh"
    ? "Check chilled-water valve behavior, AHU/PAHU schedules, and occupancy assumptions for this period."
    : current?.cluster === "afterHours"
      ? "Check operating schedule, event bookings, and after-hours ventilation commands."
      : "Use this as the baseline evidence bundle before escalating to fault diagnosis.";
  els.aiLlmSummary.innerHTML = `
    <div>
      <p class="eyebrow">LLM Chart Brief</p>
      <h3>${escapeHtml(currentConfig.label)}</h3>
      <p>The dashboard packages focus-building live coverage, SDE4 cooling, outdoor weather context, regime assignment, residual score, and evidence counts into a prompt-ready health-monitoring summary.</p>
    </div>
    <ul>
      <li>Current cooling regime: <strong>${escapeHtml(currentConfig.label)}</strong>; outlier score <strong>${outlierScore}/100</strong>.</li>
      <li>Last 7 days include <strong>${mildHighCount}</strong> mild-weather high-cooling hours, <strong>${afterHoursCount}</strong> after-hours cooling hours, and <strong>${weatherCount}</strong> weather-driven hours.</li>
      <li>Weather-cooling coupling is <strong>${escapeHtml(couplingLabel(model.coupling))}</strong> using <strong>${escapeHtml(model.weatherSource)}</strong> weather context.</li>
      <li>${escapeHtml(nextAction)}</li>
    </ul>
  `;
}

function aiAgentModelContext(model = state.aiHealthCache) {
  const current = model?.current;
  const clusterConfig = current ? aiClusterConfig(current.cluster) : aiClusterConfig("normal");
  return {
    model,
    current,
    clusterConfig,
    outlierScore: current ? Math.round(current.outlierScore) : 0,
    cooling: current ? formatMetric(current.coolingKwh, "kWh/h", 1) : "-",
    weather: current ? `${formatNumber(current.tempC, 1)} degC, ${formatNumber(current.humidityPct, 0)}% RH` : "-",
    coupling: model ? couplingLabel(model.coupling) : "Pending",
    couplingValue: model ? formatNumber(model.coupling, 2) : "-",
    mildHighCount: model?.clusterCounts?.mildHigh || 0,
    afterHoursCount: model?.clusterCounts?.afterHours || 0,
    weatherCount: model?.clusterCounts?.weather || 0,
  };
}

function defaultAiAgentMessage(model = state.aiHealthCache) {
  if (!model?.current) {
    return "SDE4 cooling health evidence is still loading.";
  }
  const context = aiAgentModelContext(model);
  return `Current SDE4 regime is ${context.clusterConfig.label}. Cooling is ${context.cooling} under ${context.weather}; residual outlier score is ${context.outlierScore}/100.`;
}

function aiAgentReply(prompt) {
  const context = aiAgentModelContext();
  if (!context.model?.current) return "I need the SDE4 cooling-health model to finish loading before giving an evidence-based answer.";
  const normalized = prompt.toLowerCase();
  if (/regime|current|explain|状态|当前/.test(normalized)) {
    return `${context.clusterConfig.label}: ${context.clusterConfig.description} Current cooling is ${context.cooling}, weather context is ${context.weather}, and the outlier score is ${context.outlierScore}/100.`;
  }
  if (/check|first|action|检查|建议|排查/.test(normalized)) {
    if (context.current.cluster === "mildHigh") {
      return "First checks: chilled-water valve position, PAHU/AHU schedule, VAV airflow commands, and whether the zone is in after-hours operation. The key evidence is high cooling under mild weather.";
    }
    if (context.current.cluster === "afterHours") {
      return "First checks: operating schedule, event booking, occupancy override, and nighttime ventilation command. The key evidence is material cooling during after-hours periods.";
    }
    return "First checks: confirm cooling meter freshness, compare current point with the weather-normalized baseline, then inspect the Brick chain Chilled water -> Cooling BTU meter -> Cooling hourly.";
  }
  if (/weather|coupling|temperature|humidity|天气|气象/.test(normalized)) {
    return `Weather coupling is ${context.coupling} with r = ${context.couplingValue}. The model uses ${context.model.weatherSource}; the current weather context is ${context.weather}.`;
  }
  if (/gap|confidence|data|coverage|缺|置信/.test(normalized)) {
    return `Current limits: only ${context.model.building} has public realtime coverage; water is not mapped; equipment-level BAS point mapping is partial. The clustering uses ${context.model.rows.length} hourly cooling points and ${context.model.weatherSource} weather context.`;
  }
  return `I would treat this as a cooling-health question. Current regime: ${context.clusterConfig.label}; outlier score ${context.outlierScore}/100; evidence counts include ${context.mildHighCount} mild-weather high-cooling hours and ${context.afterHoursCount} after-hours cooling hours.`;
}

function renderAiAgentWindow(model = state.aiHealthCache) {
  if (!els.aiAgentMessages) return;
  if (els.aiAgentStatus) {
    els.aiAgentStatus.textContent = model?.weatherSource ? `${model.building} · ${model.weatherSource}` : "Evidence agent";
  }
  const messages = [
    { role: "agent", text: defaultAiAgentMessage(model) },
    ...state.aiAgentMessages,
  ];
  els.aiAgentMessages.innerHTML = messages
    .map((message) => `
      <div class="ai-agent-message ${message.role}">
        <span>${message.role === "user" ? "You" : "Agent"}</span>
        <p>${escapeHtml(message.text)}</p>
      </div>
    `)
    .join("");
  els.aiAgentMessages.scrollTop = els.aiAgentMessages.scrollHeight;
}

function submitAiAgentPrompt(prompt) {
  const text = String(prompt || "").trim();
  if (!text) return;
  state.aiAgentMessages.push({ role: "user", text });
  state.aiAgentMessages.push({ role: "agent", text: aiAgentReply(text) });
  if (state.aiAgentMessages.length > 10) state.aiAgentMessages = state.aiAgentMessages.slice(-10);
  renderAiAgentWindow();
}

function setAiHealthLoading(message) {
  if (els.aiHealthKpis) {
    els.aiHealthKpis.innerHTML = `<div class="ai-health-loading">${escapeHtml(message)}</div>`;
  }
  if (els.aiClusterChart) els.aiClusterChart.innerHTML = "";
  if (els.aiRegimeTimeline) els.aiRegimeTimeline.innerHTML = "";
  if (els.aiLlmSummary) els.aiLlmSummary.innerHTML = "";
  if (els.aiAgentMessages) {
    els.aiAgentMessages.innerHTML = `
      <div class="ai-agent-message agent">
        <span>Agent</span>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
}

async function renderAiHealthMonitor({ force = false } = {}) {
  if (!els.aiHealthKpis || state.aiHealthLoading) return;
  state.aiHealthLoading = true;
  setAiHealthLoading("Loading SDE4 cooling history and weather context...");
  try {
    const model = await buildAiHealthModel(force);
    renderAiHealthKpis(model);
    renderAiClusterChart(model);
    renderAiRegimeTimeline(model);
    renderAiLlmSummary(model);
    renderAiAgentWindow(model);
  } catch (error) {
    console.error(error);
    setAiHealthLoading(`AI health monitor unavailable: ${error.message}`);
  } finally {
    state.aiHealthLoading = false;
  }
}

function setExternalButtonState(datasetId) {
  els.externalDataButtons.forEach((button) => {
    const active = button.dataset.external === datasetId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setExternalPanelOpen(open) {
  state.externalPanelOpen = open;
  els.externalContextPanel?.classList.toggle("hidden", !open);
}

function valueRange(seriesValues) {
  const values = seriesValues.map(Number).filter(Number.isFinite);
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

function linePath(values, yAccessor, width = 330, height = 148) {
  const padding = { left: 14, right: 14, top: 14, bottom: 18 };
  const [min, max] = valueRange(values.map(yAccessor));
  const span = max - min || 1;
  return values
    .map((item, index) => {
      const x = padding.left + (index / Math.max(values.length - 1, 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((yAccessor(item) - min) / span) * (height - padding.top - padding.bottom);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function lineChartSvg(series) {
  const width = 330;
  const height = 148;
  const grid = [36, 72, 108]
    .map((y) => `<line x1="14" y1="${y}" x2="316" y2="${y}" />`)
    .join("");
  const paths = series
    .map(
      (item) =>
        `<path d="${linePath(item.values, item.y)}" fill="none" stroke="${item.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join("");
  const legend = series
    .map((item, index) => `<span><i style="background:${item.color}"></i>${item.name}</span>`)
    .join("");
  return `
    <div class="chart-card">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="External energy trend">
        <g class="chart-grid">${grid}</g>
        ${paths}
      </svg>
      <div class="chart-legend">${legend}</div>
    </div>
  `;
}

function barChartSvg(values, labelAccessor, valueAccessor, color = "#003d7c") {
  const max = Math.max(...values.map(valueAccessor).filter(Number.isFinite), 1);
  return `
    <div class="bar-chart">
      ${values
        .map((item) => {
          const value = valueAccessor(item);
          const width = Math.max((value / max) * 100, 1);
          return `
            <div class="bar-row">
              <span>${labelAccessor(item)}</span>
              <div><i style="width:${width.toFixed(1)}%; background:${color}"></i></div>
              <strong>${formatNumber(value, 0)}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function externalKpi(label, value, note = "") {
  return `
    <div class="external-kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      ${note ? `<small>${note}</small>` : ""}
    </div>
  `;
}

function externalDatasetView(datasetId) {
  const data = state.externalData[datasetId];
  if (!data) {
    return {
      title: "External data unavailable",
      body: '<p class="empty-note">EMA/data.gov.sg files have not loaded.</p>',
    };
  }
  const meta = {
    source: data.source,
    sourceUrl: data.source_url,
    retrievedAt: data.retrieved_at,
  };

  if (datasetId === "electricity-consumption") {
    const generation = data.series.find((item) => item.name === "Electricity Generation")?.values || [];
    const consumption = data.series.find((item) => item.name === "Electricity Consumption")?.values || [];
    return {
      title: "Electricity consumption",
      ...meta,
      body: `
        <div class="external-kpis">
          ${externalKpi("Latest consumption", `${formatNumber(data.summary.latest_consumption_gwh, 1)} GWh`, `${data.summary.latest_consumption_year || data.summary.latest_year}`)}
          ${externalKpi("YoY change", `${formatNumber(data.summary.yoy_consumption_pct, 2)}%`, "national")}
          ${externalKpi("Generation", `${formatNumber(data.summary.latest_generation_gwh, 1)} GWh`, `${data.summary.latest_generation_year || data.summary.latest_year}`)}
        </div>
        ${lineChartSvg([
          { name: "Generation", color: "#003d7c", values: generation, y: (item) => item.value_gwh },
          { name: "Consumption", color: "#ef7c00", values: consumption, y: (item) => item.value_gwh },
        ])}
        <p class="external-note">Use this as national baseline context for campus energy narratives. It should not replace NUS PI meter values.</p>
      `,
    };
  }

  if (datasetId === "system-demand") {
    const values = data.values || [];
    return {
      title: "System demand context",
      ...meta,
      body: `
        <div class="external-kpis">
          ${externalKpi("Latest period", data.summary.latest_period)}
          ${externalKpi("Generation proxy", `${formatNumber(data.summary.latest_generation_gwh, 1)} GWh`, "monthly")}
          ${externalKpi("MoM change", `${formatNumber(data.summary.mom_generation_pct, 2)}%`, "proxy")}
        </div>
        ${barChartSvg(values, (item) => item.period, (item) => item.value_gwh, "#287c6f")}
        <p class="external-note">${data.note}</p>
      `,
    };
  }

  const annual = data.annual || [];
  const regionValues = (data.latest_by_region || [])
    .slice()
    .sort((a, b) => b.installed_capacity_kwac - a.installed_capacity_kwac)
    .slice(0, 5);
  return {
    title: "Solar PV deployment",
    ...meta,
    body: `
      <div class="external-kpis">
        ${externalKpi("Installed capacity", `${formatNumber(data.summary.latest_installed_capacity_kwac / 1000, 1)} MWac`, `${data.summary.latest_year}`)}
        ${externalKpi("YoY change", `${formatNumber(data.summary.yoy_capacity_pct, 2)}%`, "capacity")}
        ${externalKpi("Installations", formatNumber(data.summary.latest_installations, 0), `${data.summary.latest_year}`)}
      </div>
      ${lineChartSvg([{ name: "Installed capacity", color: "#ef7c00", values: annual, y: (item) => item.installed_capacity_kwac }])}
      <h4 class="external-subtitle">Top planning regions</h4>
      ${barChartSvg(regionValues, (item) => item.region, (item) => item.installed_capacity_kwac / 1000, "#ef7c00")}
      <p class="external-note">Use this as PV deployment benchmark. NUS PV output still comes from the building-level PI/FastAPI pipeline.</p>
    `,
  };
}

function renderExternalDataPanel(datasetId = state.activeExternalDataset, options = {}) {
  if (!els.externalVizPanel) return;
  const { open = true } = options;
  state.activeExternalDataset = datasetId;
  setExternalButtonState(datasetId);
  const view = externalDatasetView(datasetId);
  const sourceMeta = view.source
    ? `<div class="external-source">
        <span>${view.source}</span>
        ${view.sourceUrl ? `<a href="${view.sourceUrl}" target="_blank" rel="noreferrer">Source</a>` : ""}
        ${view.retrievedAt ? `<small>Retrieved ${formatTimestamp(view.retrievedAt)}</small>` : ""}
      </div>`
    : "";
  els.externalVizPanel.innerHTML = `
    <article class="external-viz-card">
      <header>
        <div>
          <p class="eyebrow">External data</p>
          <h3>${view.title}</h3>
        </div>
        ${sourceMeta}
      </header>
      ${view.body}
    </article>
  `;
  setExternalPanelOpen(open);
}

function renderBuildingList() {
  const features = visibleFeatures().slice().sort((a, b) => a.properties.short_name.localeCompare(b.properties.short_name));
  els.buildingList.innerHTML = "";
  features.forEach((feature) => {
    const props = feature.properties;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "building-list-item";
    item.innerHTML = `
      <span>${props.short_name}</span>
      <div class="building-list-text">
        <strong>${props.name}</strong>
        ${props.grouped_marker ? `<small>${props.child_summary}</small>` : ""}
      </div>
    `;
    item.addEventListener("click", () => {
      activateTab("buildings");
      selectBuilding(feature);
      zoomToFeature(feature, 17);
    });
    els.buildingList.appendChild(item);
  });
}

function realtimePlaceLabel(buildingCode) {
  const focus = focusBuildings.find((item) => item.code === buildingCode);
  if (!focus || focus.name === buildingCode) return buildingCode;
  return `${buildingCode} - ${focus.name}`;
}

function historyDefinitionsForPlace(buildingCode = state.activeRealtimeBuilding) {
  return historyConfig.metrics.map((template) => {
    const point = typeof template.point === "function" ? template.point(buildingCode) : template.point;
    const points = typeof template.points === "function" ? template.points(buildingCode) : template.points;
    const componentPoints = typeof template.componentPoints === "function" ? template.componentPoints(buildingCode) : template.componentPoints;
    return {
      ...template,
      building: buildingCode,
      point,
      points,
      componentPoints,
    };
  });
}

function historyPointByKey(key, buildingCode = state.activeRealtimeBuilding) {
  const definitions = historyDefinitionsForPlace(buildingCode);
  return definitions.find((item) => item.key === key) || definitions[0];
}

function historyPointByName(pointName, buildingCode = state.activeRealtimeBuilding) {
  return historyDefinitionsForPlace(buildingCode).find((item) => {
    const pointNames = [...(item.points || [item.point]), ...(item.componentPoints || [])];
    return pointNames.includes(pointName);
  });
}

function historyCacheKey(definition) {
  const pointKey = (definition.points || [definition.point]).join(",");
  return `${definition.source}|${definition.building}|${definition.key}|${pointKey}|${definition.range}`;
}

function historyUrl(definition, pointName) {
  const params = new URLSearchParams({
    point: pointName,
    start: definition.range,
    stop: "now()",
    limit: "50000",
  });
  if (definition.source === "meter") params.set("building", definition.building);
  const baseUrl = definition.source === "meter" ? historyConfig.meterBaseUrl : historyConfig.beehubBaseUrl;
  return `${baseUrl}?${params.toString()}`;
}

function normalizeHistoryPayload(payload) {
  const rows = Array.isArray(payload?.points) ? payload.points : [];
  return rows
    .map((row) => ({
      time: row.t || row.time || row.timestamp,
      value: Number(row.v ?? row.value),
    }))
    .filter((row) => row.time && Number.isFinite(row.value))
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}

async function loadHistoryPoint(definition, pointName) {
  const response = await fetch(historyUrl(definition, pointName), { cache: "no-store" });
  if (!response.ok) throw new Error(`${pointName}: HTTP ${response.status}`);
  const payload = await response.json();
  return normalizeHistoryPayload(payload);
}

function combineHistoryRows(rowSets, method = "sum") {
  const groups = new Map();
  rowSets.flat().forEach((row) => {
    if (!groups.has(row.time)) groups.set(row.time, []);
    groups.get(row.time).push(row.value);
  });
  return Array.from(groups.entries())
    .map(([time, values]) => ({
      time,
      value: method === "average" ? average(values) : sum(values),
    }))
    .filter((row) => row.time && Number.isFinite(row.value))
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}

function normalizeHistorySign(rows, definition) {
  if (!definition.absolute) return rows;
  return rows.map((row) => ({
    ...row,
    value: Math.abs(row.value),
  }));
}

async function loadHistory(definition) {
  const key = historyCacheKey(definition);
  if (state.historyCache.has(key)) return state.historyCache.get(key);
  const pointNames = definition.points || [definition.point];
  const results = await Promise.allSettled(pointNames.map((pointName) => loadHistoryPoint(definition, pointName)));
  const rowSets = results
    .filter((result) => result.status === "fulfilled" && result.value.length)
    .map((result) => result.value);
  if (!rowSets.length) {
    const failed = results.find((result) => result.status === "rejected");
    throw new Error(failed?.reason?.message || `${definition.label}: no history data`);
  }
  const combinedRows = rowSets.length === 1 ? rowSets[0] : combineHistoryRows(rowSets, definition.combine || "sum");
  const rows = normalizeHistorySign(combinedRows, definition);
  state.historyCache.set(key, rows);
  return rows;
}

function singaporeBucket(date, bucket) {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const hour = bucket === "day" ? 0 : shifted.getUTCHours();
  const key = bucket === "day"
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00`;
  return {
    key,
    timestamp: Date.UTC(year, month, day, hour) - 8 * 60 * 60 * 1000,
  };
}

function aggregateHistory(rows, bucket = "hour") {
  const groups = new Map();
  rows.forEach((row) => {
    const date = new Date(row.time);
    if (Number.isNaN(date.getTime())) return;
    const bucketInfo = singaporeBucket(date, bucket);
    if (!groups.has(bucketInfo.key)) {
      groups.set(bucketInfo.key, { label: bucketInfo.key, timestamp: bucketInfo.timestamp, values: [] });
    }
    groups.get(bucketInfo.key).values.push(row.value);
  });
  return Array.from(groups.values())
    .map((group) => ({
      label: group.label,
      timestamp: group.timestamp,
      value: average(group.values),
      count: group.values.length,
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function historyDigits(definition) {
  if (definition.unit === "ppm" || definition.unit === "L/s") return 0;
  if (definition.key === "pv") return 1;
  return 1;
}

function formatHistoryValue(value, definition) {
  return formatMetric(value, definition.unit, historyDigits(definition));
}

function historyTooltipTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(date);
}

function chartTooltipLabel(row, definition) {
  return `${historyTooltipTime(row.timestamp)} - ${formatHistoryValue(row.value, definition)}`;
}

function historyDisplayTime(timestamp, definition) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  const options = definition.range === "-24h"
    ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore" }
    : { month: "short", day: "numeric", hour: "2-digit", timeZone: "Asia/Singapore" };
  return new Intl.DateTimeFormat("en-SG", options).format(date);
}

function summarizeHistory(rawRows, aggregatedRows) {
  const values = rawRows.map((row) => row.value).filter(Number.isFinite);
  const latest = rawRows.at(-1);
  const peak = aggregatedRows.reduce((best, row) => (!best || row.value > best.value ? row : best), null);
  const low = aggregatedRows.reduce((best, row) => (!best || row.value < best.value ? row : best), null);
  return {
    latest: latest?.value ?? null,
    average: average(values),
    peak,
    low,
    rawCount: rawRows.length,
    bucketCount: aggregatedRows.length,
  };
}

function chartDomain(values) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const padding = (max - min) * 0.08;
  return { min: min - padding, max: max + padding };
}

function chartY(value, domain, top, height) {
  return top + ((domain.max - value) / (domain.max - domain.min)) * height;
}

function chartX(index, count, left, width) {
  if (count <= 1) return left;
  return left + (index / (count - 1)) * width;
}

function renderLineChart(rows, definition) {
  const width = 760;
  const height = 310;
  const left = 58;
  const right = 18;
  const top = 24;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = rows.map((row) => row.value);
  const domain = chartDomain(values);
  const points = rows.map((row, index) => {
    const x = chartX(index, rows.length, left, plotWidth);
    const y = chartY(row.value, domain, top, plotHeight);
    return { x, y, row };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const baseline = top + plotHeight;
  const area = points.length
    ? `M${points[0].x.toFixed(1)},${baseline} ${points.map((point) => `L${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")} L${points.at(-1).x.toFixed(1)},${baseline} Z`
    : "";
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = top + plotHeight * ratio;
    const value = domain.max - (domain.max - domain.min) * ratio;
    return `<line class="grid-line" x1="${left}" y1="${y}" x2="${left + plotWidth}" y2="${y}"></line><text class="chart-label" x="8" y="${y + 4}">${formatNumber(value, historyDigits(definition))}</text>`;
  }).join("");
  const labelIndexes = [0, Math.floor(rows.length / 2), rows.length - 1].filter((index, pos, arr) => index >= 0 && arr.indexOf(index) === pos);
  const xLabels = labelIndexes.map((index) => {
    const x = chartX(index, rows.length, left, plotWidth);
    return `<text class="chart-label" x="${x}" y="${height - 12}" text-anchor="middle">${historyDisplayTime(rows[index].timestamp, definition)}</text>`;
  }).join("");
  const hitWidth = Math.max(12, plotWidth / Math.max(rows.length, 1));
  const hoverTargets = points.map((point) => {
    const tooltip = chartTooltipLabel(point.row, definition);
    const x = Math.max(left, point.x - hitWidth / 2);
    const width = Math.min(hitWidth, left + plotWidth - x);
    return `
      <g class="chart-hit" tabindex="0" data-tooltip="${escapeHtml(tooltip)}">
        <title>${escapeHtml(tooltip)}</title>
        <rect class="chart-hover-zone" x="${x.toFixed(1)}" y="${top}" width="${width.toFixed(1)}" height="${plotHeight}"></rect>
        <circle class="chart-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" stroke="${definition.color}"></circle>
      </g>
    `;
  }).join("");
  return `
    <div class="trend-chart-frame">
      <div class="chart-tooltip hidden"></div>
      <svg class="trend-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(definition.label)} trend chart">
        ${grid}
        <line class="axis" x1="${left}" y1="${baseline}" x2="${left + plotWidth}" y2="${baseline}"></line>
        <path class="chart-area" d="${area}" fill="${definition.color}"></path>
        <path class="chart-line" d="${path}" stroke="${definition.color}"></path>
        ${hoverTargets}
        ${xLabels}
      </svg>
    </div>
  `;
}

function renderBarChart(rows, definition) {
  const width = 760;
  const height = 310;
  const left = 50;
  const right = 18;
  const top = 24;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = rows.map((row) => row.value);
  const domain = { min: 0, max: Math.max(...values, 1) * 1.08 };
  const gap = 3;
  const slotWidth = plotWidth / Math.max(rows.length, 1);
  const barWidth = Math.max(3, slotWidth - gap);
  const baseline = top + plotHeight;
  const bars = rows.map((row, index) => {
    const x = left + index * slotWidth + gap / 2;
    const y = chartY(row.value, domain, top, plotHeight);
    return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${(baseline - y).toFixed(1)}" fill="${definition.color}"></rect>`;
  }).join("");
  const hoverTargets = rows.map((row, index) => {
    const x = left + index * slotWidth + gap / 2;
    const y = chartY(row.value, domain, top, plotHeight);
    const tooltip = chartTooltipLabel(row, definition);
    return `
      <g class="chart-hit" tabindex="0" data-tooltip="${escapeHtml(tooltip)}">
        <title>${escapeHtml(tooltip)}</title>
        <rect class="chart-hover-bar" x="${x.toFixed(1)}" y="${top}" width="${barWidth.toFixed(1)}" height="${plotHeight}"></rect>
        <circle class="chart-point" cx="${(x + barWidth / 2).toFixed(1)}" cy="${y.toFixed(1)}" r="4" stroke="${definition.color}"></circle>
      </g>
    `;
  }).join("");
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = top + plotHeight * ratio;
    const value = domain.max - (domain.max - domain.min) * ratio;
    return `<line class="grid-line" x1="${left}" y1="${y}" x2="${left + plotWidth}" y2="${y}"></line><text class="chart-label" x="8" y="${y + 4}">${formatNumber(value, historyDigits(definition))}</text>`;
  }).join("");
  const labelIndexes = [0, Math.floor(rows.length / 2), rows.length - 1].filter((index, pos, arr) => index >= 0 && arr.indexOf(index) === pos);
  const xLabels = labelIndexes.map((index) => {
    const x = left + index * slotWidth + slotWidth / 2;
    return `<text class="chart-label" x="${x}" y="${height - 12}" text-anchor="middle">${historyDisplayTime(rows[index].timestamp, definition)}</text>`;
  }).join("");
  return `
    <div class="trend-chart-frame">
      <div class="chart-tooltip hidden"></div>
      <svg class="trend-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(definition.label)} bar chart">
        ${grid}
        <line class="axis" x1="${left}" y1="${baseline}" x2="${left + plotWidth}" y2="${baseline}"></line>
        ${bars}
        ${hoverTargets}
        ${xLabels}
      </svg>
    </div>
  `;
}

function renderTrendPlaceSelector() {
  if (!els.trendPlaceSelect) return;
  const places = realtimeConfig.liveBuildings;
  if (!places.includes(state.activeRealtimeBuilding)) state.activeRealtimeBuilding = places[0] || "SDE4";
  els.trendPlaceSelect.innerHTML = places
    .map((building) => `<option value="${escapeHtml(building)}">${escapeHtml(realtimePlaceLabel(building))}</option>`)
    .join("");
  els.trendPlaceSelect.value = state.activeRealtimeBuilding;
  const live = state.realtimeByBuilding[state.activeRealtimeBuilding];
  if (els.trendPlaceMeta) {
    els.trendPlaceMeta.textContent = live
      ? `${live.points.length} realtime points · updated ${formatTimestamp(live.updateTime)}`
      : "Realtime endpoint not loaded for this place";
  }
}

function renderTrendTabs(activeKey) {
  if (!els.trendTabs) return;
  els.trendTabs.innerHTML = historyDefinitionsForPlace(state.activeRealtimeBuilding)
    .map((definition) => `
      <button type="button" class="${definition.key === activeKey ? "active" : ""}" data-history-key="${definition.key}">
        <strong>${escapeHtml(definition.label)}</strong>
        <span>${escapeHtml(definition.range === "-24h" ? "Last 24 hours" : "Last 7 days")}</span>
      </button>
    `)
    .join("");
}

function renderTrendKpis(summary, definition) {
  els.trendKpis.innerHTML = `
    <div class="trend-kpi">
      <span>Latest</span>
      <strong>${formatHistoryValue(summary.latest, definition)}</strong>
      <small>most recent sample</small>
    </div>
    <div class="trend-kpi">
      <span>Mean</span>
      <strong>${formatHistoryValue(summary.average, definition)}</strong>
      <small>${summary.rawCount.toLocaleString()} raw samples</small>
    </div>
    <div class="trend-kpi">
      <span>Peak</span>
      <strong>${formatHistoryValue(summary.peak?.value, definition)}</strong>
      <small>${summary.peak ? historyDisplayTime(summary.peak.timestamp, definition) : "-"}</small>
    </div>
    <div class="trend-kpi">
      <span>Low</span>
      <strong>${formatHistoryValue(summary.low?.value, definition)}</strong>
      <small>${summary.low ? historyDisplayTime(summary.low.timestamp, definition) : "-"}</small>
    </div>
  `;
}

function renderTrendLiveMeters() {
  if (!els.trendLiveMeters) return;
  const live = state.realtimeByBuilding[state.activeRealtimeBuilding];
  if (!live) {
    els.trendLiveMeters.innerHTML = `
      <div class="trend-live-card">
        <span>Live meter snapshot</span>
        <strong>Waiting</strong>
        <small>${escapeHtml(state.activeRealtimeBuilding)} realtime endpoint has not returned data yet.</small>
      </div>
    `;
    return;
  }

  els.trendLiveMeters.innerHTML = liveMeterSummaryCards(live)
    .map((card) => `
      <div class="trend-live-card">
        <span>${escapeHtml(card.label)}</span>
        <strong>${card.value}</strong>
        <small>${escapeHtml(card.note)}</small>
      </div>
    `)
    .join("");
}

function bindChartTooltip() {
  const frame = els.trendChart.querySelector(".trend-chart-frame");
  const tooltip = els.trendChart.querySelector(".chart-tooltip");
  if (!frame || !tooltip) return;

  const hideTooltip = () => {
    tooltip.classList.add("hidden");
  };

  const showTooltip = (event, target) => {
    const text = target.dataset.tooltip;
    if (!text) return;
    const frameRect = frame.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const clientX = event.clientX || targetRect.left + targetRect.width / 2;
    const clientY = event.clientY || targetRect.top + targetRect.height / 2;
    tooltip.textContent = text;
    tooltip.classList.remove("hidden");

    const maxLeft = Math.max(10, frameRect.width - tooltip.offsetWidth - 10);
    const maxTop = Math.max(10, frameRect.height - tooltip.offsetHeight - 10);
    const left = Math.min(Math.max(10, clientX - frameRect.left + 14), maxLeft);
    const top = Math.min(Math.max(10, clientY - frameRect.top - tooltip.offsetHeight - 12), maxTop);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  els.trendChart.querySelectorAll(".chart-hit").forEach((target) => {
    target.addEventListener("pointerenter", (event) => showTooltip(event, target));
    target.addEventListener("pointermove", (event) => showTooltip(event, target));
    target.addEventListener("pointerleave", hideTooltip);
    target.addEventListener("focus", (event) => showTooltip(event, target));
    target.addEventListener("blur", hideTooltip);
  });
}

function trendNarrative(summary, definition) {
  const bucketText = definition.bucket === "hour" ? "hourly means" : "daily means";
  return `${definition.metric}: ${summary.rawCount.toLocaleString()} raw samples are aggregated into ${summary.bucketCount.toLocaleString()} ${bucketText}. Latest value is ${formatHistoryValue(summary.latest, definition)}; peak aggregated value is ${formatHistoryValue(summary.peak?.value, definition)}.`;
}

async function renderTrendChart(key = state.activeHistoryKey) {
  const definition = historyPointByKey(key);
  state.activeHistoryKey = definition.key;
  renderTrendPlaceSelector();
  renderTrendLiveMeters();
  renderTrendTabs(definition.key);
  if (els.trendModalEyebrow) els.trendModalEyebrow.textContent = "Realtime Analytics";
  els.trendModalTitle.textContent = `${definition.label} trend`;
  els.trendModalSubtitle.textContent = `${realtimePlaceLabel(definition.building)} · ${definition.metric} · ${definition.range === "-24h" ? "last 24 hours" : "last 7 days"} · ${definition.bucket} aggregation`;
  els.trendStatus.textContent = "Loading history data...";
  els.trendKpis.innerHTML = "";
  els.trendChart.innerHTML = "";
  els.trendNarrative.textContent = "";
  try {
    const rawRows = await loadHistory(definition);
    const aggregatedRows = aggregateHistory(rawRows, definition.bucket);
    const summary = summarizeHistory(rawRows, aggregatedRows);
    renderTrendKpis(summary, definition);
    els.trendChart.innerHTML = definition.chart === "bar"
      ? renderBarChart(aggregatedRows, definition)
      : renderLineChart(aggregatedRows, definition);
    bindChartTooltip();
    els.trendStatus.textContent = `${aggregatedRows.length.toLocaleString()} aggregated points loaded from ${rawRows.length.toLocaleString()} raw samples.`;
    els.trendNarrative.textContent = trendNarrative(summary, definition);
  } catch (error) {
    els.trendStatus.textContent = `History data unavailable: ${error.message}`;
    els.trendChart.innerHTML = '<p class="empty-note">This point does not currently expose history from the public endpoint.</p>';
  }
}

function openTrendModal(key = state.activeHistoryKey || "electricity") {
  if (!els.trendModal) return;
  closeBrickModal();
  els.trendModal.classList.remove("hidden");
  els.mapRealtimeView?.classList.add("active");
  els.mapRealtimeView?.setAttribute("aria-pressed", "true");
  renderTrendChart(key);
}

function closeTrendModal() {
  els.trendModal?.classList.add("hidden");
  els.mapRealtimeView?.classList.remove("active");
  els.mapRealtimeView?.setAttribute("aria-pressed", "false");
}

function liveMeterSummaryCards(live) {
  const pvComponentCount = live.pvComponentPoints?.length || 0;
  return [
    {
      label: "Electricity demand",
      value: formatMetric(live.electricityHourlyKwh, "kWh/h", 1),
      note: live.electricityHourlyKwh === null ? "not exposed by public endpoint" : "live hourly meter",
    },
    {
      label: "Cooling",
      value: formatMetric(live.coolingHourlyKwh, "kWh/h", 1),
      note: "live cooling stream",
    },
    {
      label: "PV generation",
      value: formatLivePvMetric(live.pvKw),
      note: `ALL hourly generation primary${pvComponentCount ? `; ${pvComponentCount} module breakdowns` : ""}`,
    },
  ];
}

function liveMetricValue(live, definition) {
  if (!live) return null;
  if (definition.key === "electricity") return live.electricityHourlyKwh;
  if (definition.key === "cooling") return live.coolingHourlyKwh;
  if (definition.key === "pv") return live.pvKw;
  if (definition.key === "co2") return live.indoorCo2Ppm;
  if (definition.key === "temperature") return live.indoorTemperatureC;
  if (definition.key === "humidity") return live.indoorHumidityPct;
  if (definition.key === "airflow") return live.airflow;
  const pointNames = definition.points || [definition.point];
  const latest = live.points.find((point) => pointNames.includes(point.point));
  return latest ? Number(latest.value) : null;
}

function brickGraphForPlace(buildingCode = state.activeBrickBuilding) {
  return brickGraphConfig.graphs[buildingCode] || brickGraphConfig.graphs.SDE4;
}

function brickAllNodes(graph = brickGraphForPlace()) {
  return graph.lanes.flatMap((lane) => lane.nodes);
}

function brickNodeById(nodeId, graph = brickGraphForPlace()) {
  return brickAllNodes(graph).find((node) => node.id === nodeId) || brickAllNodes(graph)[0];
}

function brickNodeTitle(nodeId, graph = brickGraphForPlace()) {
  return brickNodeById(nodeId, graph)?.title || nodeId;
}

function brickNodeMatches(node, live) {
  if (!node?.pointNames?.length || !live?.points?.length) return [];
  const pointSet = new Set(node.pointNames);
  return live.points.filter((point) => pointSet.has(point.point));
}

function brickNodeLiveValue(node, live) {
  if (!node || !live) return "";
  if (node.metricKey) {
    const definition = historyPointByKey(node.metricKey, state.activeBrickBuilding);
    const value = liveMetricValue(live, definition);
    return formatHistoryValue(value, definition);
  }
  const matches = brickNodeMatches(node, live);
  if (matches.length === 1) return formatNumber(matches[0].value, 1);
  if (matches.length > 1) return `${matches.length} live points`;
  return "";
}

function brickStatusClass(status = "") {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function brickNodeTypeClass(node) {
  const kind = String(node?.kind || "").toLowerCase();
  if (kind.includes("building") || kind.includes("location")) return "place";
  if (kind.includes("system")) return "system";
  if (kind.includes("point")) return "point";
  return "equipment";
}

function brickNodeRadius(node) {
  const type = brickNodeTypeClass(node);
  if (type === "place") return node.id === "sde4" ? 38 : 34;
  if (type === "system") return 34;
  if (type === "equipment") return 32;
  return 30;
}

function truncateSvgText(value, max = 24) {
  const text = String(value || "");
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function svgTextLines(value, maxLineLength = 16, maxLines = 2) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLineLength) {
      current = candidate;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  if (!lines.length) lines.push(String(value || ""));
  const trimmed = lines.slice(0, maxLines);
  if (lines.length > maxLines) trimmed[trimmed.length - 1] = truncateSvgText(trimmed[trimmed.length - 1], maxLineLength);
  return trimmed;
}

function brickNodeLayout(graph) {
  const laneX = {
    place: 120,
    systems: 390,
    equipment: 730,
    points: 1080,
  };
  const viewBox = { width: 1240, height: 700 };
  const layout = new Map();
  graph.lanes.forEach((lane) => {
    const nodes = lane.nodes;
    const top = nodes.length > 5 ? 72 : 128;
    const bottom = nodes.length > 5 ? 615 : 575;
    const step = nodes.length > 1 ? (bottom - top) / (nodes.length - 1) : 0;
    nodes.forEach((node, index) => {
      layout.set(node.id, {
        node,
        lane: lane.key,
        x: laneX[lane.key],
        y: nodes.length > 1 ? top + step * index : viewBox.height / 2,
        radius: brickNodeRadius(node),
      });
    });
  });
  return { layout, viewBox };
}

function renderBrickNetworkNode(item, live) {
  const { node, x, y, radius } = item;
  const typeClass = brickNodeTypeClass(node);
  const statusClass = brickStatusClass(node.status);
  const matches = brickNodeMatches(node, live);
  const liveValue = brickNodeLiveValue(node, live);
  const titleLines = svgTextLines(node.title, typeClass === "point" ? 14 : 16, 2);
  const subtitle = liveValue || node.kind;
  const isActive = node.id === state.activeBrickNodeId;
  const titleStart = y - (titleLines.length > 1 ? 11 : 4);
  const subtitleY = y + (titleLines.length > 1 ? 24 : 18);
  const titleMarkup = titleLines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : 15}">${escapeHtml(line)}</tspan>`)
    .join("");
  const countText = node.pointNames?.length ? `${matches.length}/${node.pointNames.length} live` : "";
  return `
    <g class="brick-network-node ${typeClass} ${statusClass} ${isActive ? "active" : ""}" data-brick-node="${escapeHtml(node.id)}" tabindex="0" role="button" aria-label="${escapeHtml(node.title)}">
      <title>${escapeHtml(`${node.title} · ${node.brickClass}`)}</title>
      <circle class="brick-node-halo" cx="${x}" cy="${y}" r="${radius + 9}"></circle>
      <circle class="brick-node-core" cx="${x}" cy="${y}" r="${radius}"></circle>
      <text class="brick-node-title" x="${x}" y="${titleStart}" text-anchor="middle">${titleMarkup}</text>
      <text class="brick-node-subtitle" x="${x}" y="${subtitleY}" text-anchor="middle">${escapeHtml(truncateSvgText(subtitle, 18))}</text>
      ${countText ? `<text class="brick-node-count" x="${x}" y="${y + radius + 18}" text-anchor="middle">${escapeHtml(countText)}</text>` : ""}
    </g>
  `;
}

function renderBrickNetworkEdges(graph, layout) {
  return graph.relations
    .map((relation) => {
      const from = layout.get(relation.from);
      const to = layout.get(relation.to);
      if (!from || !to) return "";
      const active = relation.from === state.activeBrickNodeId || relation.to === state.activeBrickNodeId;
      const startX = from.x + from.radius;
      const endX = to.x - to.radius;
      const controlOffset = Math.max(70, Math.abs(endX - startX) * 0.45);
      const path = `M ${startX} ${from.y} C ${startX + controlOffset} ${from.y}, ${endX - controlOffset} ${to.y}, ${endX} ${to.y}`;
      const midX = (startX + endX) / 2;
      const midY = (from.y + to.y) / 2;
      return `
        <g class="brick-network-edge ${active ? "active" : ""}">
          <title>${escapeHtml(`${brickNodeTitle(relation.from, graph)} ${relation.predicate} ${brickNodeTitle(relation.to, graph)}`)}</title>
          <path d="${path}"></path>
          ${active ? `<text x="${midX}" y="${midY - 6}" text-anchor="middle">${escapeHtml(relation.predicate)}</text>` : ""}
        </g>
      `;
    })
    .join("");
}

function renderBrickNetwork(graph, live) {
  const { layout, viewBox } = brickNodeLayout(graph);
  const laneLabels = graph.lanes
    .map((lane) => {
      const first = layout.get(lane.nodes[0]?.id);
      if (!first) return "";
      return `<text class="brick-network-lane-label" x="${first.x}" y="28" text-anchor="middle">${escapeHtml(lane.label)}</text>`;
    })
    .join("");
  const edges = renderBrickNetworkEdges(graph, layout);
  const nodes = Array.from(layout.values()).map((item) => renderBrickNetworkNode(item, live)).join("");
  return `
    <svg class="brick-network-svg" viewBox="0 0 ${viewBox.width} ${viewBox.height}" role="img" aria-label="${escapeHtml(graph.label)} Brick node graph">
      <defs>
        <marker id="brickArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z"></path>
        </marker>
      </defs>
      <rect class="brick-network-bg" x="0" y="0" width="${viewBox.width}" height="${viewBox.height}" rx="10"></rect>
      ${laneLabels}
      <g class="brick-network-edges">${edges}</g>
      <g class="brick-network-nodes">${nodes}</g>
    </svg>
  `;
}

function renderBrickPlaceSelector(graph) {
  if (!els.brickPlaceSelect) return;
  els.brickPlaceSelect.innerHTML = brickGraphConfig.places
    .map((building) => `<option value="${escapeHtml(building)}">${escapeHtml(realtimePlaceLabel(building))}</option>`)
    .join("");
  els.brickPlaceSelect.value = state.activeBrickBuilding;
  const live = state.realtimeByBuilding[state.activeBrickBuilding];
  els.brickPlaceMeta.textContent = live
    ? `${live.points.length} public realtime points attached · updated ${formatTimestamp(live.updateTime)}`
    : "Seed graph loaded · waiting for public realtime endpoint";
  els.brickModalEyebrow.textContent = "Brick Model";
  els.brickModalTitle.textContent = `${graph.label} operational graph`;
  els.brickModalSubtitle.textContent = graph.sourceSummary;
}

function renderBrickSummary(graph, live) {
  const systemCount = graph.lanes.find((lane) => lane.key === "systems")?.nodes.length || 0;
  const equipmentCount = graph.lanes.find((lane) => lane.key === "equipment")?.nodes.length || 0;
  const pointNames = new Set(brickAllNodes(graph).flatMap((node) => node.pointNames || []));
  const attachedCount = live?.points.filter((point) => pointNames.has(point.point)).length || 0;
  els.brickSummary.innerHTML = [
    ["Systems", systemCount, "airside, chilled water, PV, indoor, water placeholder"],
    ["Equipment candidates", equipmentCount, "PAHU, VAV, FCU/PFCU, FAF, BTU, PV meters"],
    ["Live points attached", attachedCount, `${live?.points.length || 0} public points currently returned`],
    ["Evidence sources", graph.sources.length, "floorplans, ACMV drawings, schedules, realtime API"],
  ].map(([label, value, note]) => `
    <div class="brick-summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </div>
  `).join("");
}

function renderBrickRelations(graph) {
  els.brickRelations.innerHTML = graph.relations
    .map((relation) => `
      <span>
        <strong>${escapeHtml(brickNodeTitle(relation.from, graph))}</strong>
        ${escapeHtml(relation.predicate)}
        <strong>${escapeHtml(brickNodeTitle(relation.to, graph))}</strong>
      </span>
    `)
    .join("");
}

function renderBrickInspector(graph, live) {
  const node = brickNodeById(state.activeBrickNodeId, graph);
  const matches = brickNodeMatches(node, live);
  const related = graph.relations.filter((relation) => relation.from === node.id || relation.to === node.id);
  const liveValue = brickNodeLiveValue(node, live);
  els.brickInspector.innerHTML = `
    <div class="brick-inspector-header">
      <span class="brick-status ${brickStatusClass(node.status)}">${escapeHtml(node.status)}</span>
      <h3>${escapeHtml(node.title)}</h3>
      <p>${escapeHtml(node.kind)} · ${escapeHtml(node.brickClass)}</p>
    </div>
    <dl class="brick-detail-list">
      <div>
        <dt>Source</dt>
        <dd>${escapeHtml(node.source)}</dd>
      </div>
      <div>
        <dt>Description</dt>
        <dd>${escapeHtml(node.description)}</dd>
      </div>
      <div>
        <dt>Live value</dt>
        <dd>${escapeHtml(liveValue || "No direct live value")}</dd>
      </div>
    </dl>
    <div class="brick-inspector-section">
      <h4>Attached points</h4>
      ${
        node.pointNames?.length
          ? node.pointNames.map((pointName) => {
              const point = matches.find((item) => item.point === pointName);
              const definition = historyPointByName(pointName, state.activeBrickBuilding);
              const value = point
                ? definition
                  ? formatHistoryValue(point.value, definition)
                  : formatNumber(point.value, 2)
                : "not live";
              return `<p><strong>${escapeHtml(pointName)}</strong><span>${escapeHtml(value)}</span></p>`;
            }).join("")
          : '<p class="empty-note">No direct point attachment in the seed graph.</p>'
      }
    </div>
    <div class="brick-inspector-section">
      <h4>Relations</h4>
      ${
        related.length
          ? related.map((relation) => `
              <p>
                <strong>${escapeHtml(brickNodeTitle(relation.from, graph))}</strong>
                <span>${escapeHtml(relation.predicate)} ${escapeHtml(brickNodeTitle(relation.to, graph))}</span>
              </p>
            `).join("")
          : '<p class="empty-note">No relations listed for this seed node.</p>'
      }
    </div>
  `;
}

function renderBrickGraph() {
  if (!els.brickGraph) return;
  const graph = brickGraphForPlace();
  const live = state.realtimeByBuilding[state.activeBrickBuilding];
  const nodeIds = new Set(brickAllNodes(graph).map((node) => node.id));
  if (!nodeIds.has(state.activeBrickNodeId)) state.activeBrickNodeId = "sde4";

  renderBrickPlaceSelector(graph);
  renderBrickSummary(graph, live);
  els.brickGraph.innerHTML = renderBrickNetwork(graph, live);

  renderBrickRelations(graph);
  renderBrickInspector(graph, live);
}

function openBrickModal() {
  if (!els.brickModal) return;
  closeTrendModal();
  els.brickModal.classList.remove("hidden");
  els.mapBrickView?.classList.add("active");
  els.mapBrickView?.setAttribute("aria-pressed", "true");
  renderBrickGraph();
}

function closeBrickModal() {
  els.brickModal?.classList.add("hidden");
  els.mapBrickView?.classList.remove("active");
  els.mapBrickView?.setAttribute("aria-pressed", "false");
}

function renderRealtimeTrends(feature) {
  const props = feature.properties;
  const buildingCode = String(props.short_name || "").toUpperCase();
  const live = state.realtimeByBuilding[buildingCode];
  if (!els.realtimeTrends || !live) {
    els.realtimeTrends?.classList.add("hidden");
    return;
  }
  els.realtimeTrends.classList.remove("hidden");
  const liveCards = liveMeterSummaryCards(live)
    .map((card) => `
      <div class="trend-summary-card">
        <span>${escapeHtml(card.label)}</span>
        <strong>${card.value}</strong>
        <small>${escapeHtml(card.note)}</small>
      </div>
    `);
  const historyCards = historyDefinitionsForPlace(buildingCode)
    .map((definition) => {
      const value = liveMetricValue(live, definition);
      return `
        <div class="trend-summary-card">
          <span>${escapeHtml(definition.label)}</span>
          <strong>${formatHistoryValue(value, definition)}</strong>
          <small>${definition.range === "-24h" ? "24 h history available" : "7 d history available"}</small>
        </div>
      `;
    });
  els.trendSummary.innerHTML = [...liveCards, ...historyCards].join("");
  els.trendNote.textContent = "PV uses the ALL hourly generation point as the primary series. M1 and M2 are retained as meter-level breakdowns.";
}

function renderRealtimePoints(feature) {
  const props = feature.properties;
  const buildingCode = String(props.short_name || "").toUpperCase();
  const live = state.realtimeByBuilding[buildingCode];
  els.pointList.innerHTML = "";
  if (!live) {
    els.pointCount.textContent = "0 points";
    els.pointList.innerHTML = '<p class="empty-note">No realtime endpoint is mapped for this building.</p>';
    renderRealtimeTrends(feature);
    return;
  }
  els.pointCount.textContent = `${live.points.length} points`;
  live.points.forEach((point) => {
    const historyDefinition = historyPointByName(point.point, buildingCode);
    const pointValue = historyDefinition ? formatHistoryValue(point.value, historyDefinition) : formatNumber(point.value, 2);
    const item = document.createElement("article");
    item.className = "point-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(point.point)}</strong>
        <span>${pointValue} - ${formatTimestamp(point.time)}</span>
      </div>
      ${historyDefinition ? `<button class="point-view" type="button" data-history-key="${historyDefinition.key}">View</button>` : ""}
    `;
    item.querySelector("[data-history-key]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      openTrendModal(event.currentTarget.dataset.historyKey);
    });
    els.pointList.appendChild(item);
  });
  renderRealtimeTrends(feature);
}

function selectBuilding(feature) {
  const props = feature.properties;
  const buildingCode = String(props.short_name || "").toUpperCase();
  const live = state.realtimeByBuilding[buildingCode];
  activateTab("buildings");
  state.selectedId = props.id;
  if (live) state.activeRealtimeBuilding = buildingCode;
  els.buildingZone.textContent = `${props.zone} / ${props.type}`;
  els.buildingName.textContent = props.name;
  els.buildingStatus.textContent = statusText(props.anomaly_score, Boolean(live));
  els.buildingStatus.className = `status-pill ${live ? "live" : statusClass(props.anomaly_score)}`;
  if (props.grouped_marker && props.child_summary) {
    els.buildingBlocks.classList.remove("hidden");
    els.buildingBlocks.innerHTML = String(props.child_summary)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `<span>${item}</span>`)
      .join("");
  } else {
    els.buildingBlocks.classList.add("hidden");
    els.buildingBlocks.innerHTML = "";
  }
  els.buildingElectricity.textContent = live ? formatMetric(live.electricityHourlyKwh, "kWh/h", 1) : formatMetric(props.load_kw, "kW", 0);
  els.buildingCooling.textContent = live ? formatMetric(live.coolingHourlyKwh, "kWh/h", 1) : formatMetric(props.cooling_kw, "kW", 0);
  els.buildingWater.textContent = live ? formatMetric(live.waterM3, "m3", 1) : formatMetric(props.water_m3_today, "m3", 1);
  els.buildingPv.textContent = live ? formatLivePvMetric(live.pvKw) : formatMetric(props.solar_kw, "kW", 0);
  els.buildingEui.textContent = formatMetric(props.eui ?? props.mapbox_eui_2023, "kWh/m2-yr", 0);
  els.buildingUpdated.textContent = live ? formatTimestamp(live.updateTime) : "-";
  els.buildingInsight.textContent = live
    ? `${buildingCode} live endpoint is mapped. Indoor mean: ${formatMetric(live.indoorTemperatureC, "degC", 1)}, CO2: ${formatMetric(live.indoorCo2Ppm, "ppm", 0)}, airflow: ${formatMetric(live.airflow, "L/s", 0)}.`
    : props.grouped_marker
      ? `${props.child_count} mapped footprints are grouped under this marker. Blocks: ${props.child_summary}.`
      : `${props.ai_summary} ${props.suggested_action}`;
  els.zoomSelected.disabled = false;
  renderRealtimePoints(feature);

  if (state.map?.getSource("selected-building")) {
    state.map.getSource("selected-building").setData(feature);
  }
}

function popupHtml(props) {
  return buildingPopupHtml(props);
}

function mapboxBuildingPopupHtml(props, catalogFeature = null, displayFeature = null) {
  const catalog = catalogFeature?.properties;
  const display = displayFeature?.properties;
  const merged = {
    ...(display || catalog || {}),
    mapbox_building_type: props.building_type || "",
    mapbox_height_m: props.height_m ?? null,
    mapbox_eui_2023: props.eui_2023 ?? null,
    selected_footprint_name: display?.grouped_marker ? catalog?.name || "" : "",
  };
  return buildingPopupHtml(merged);
}

function popupTitle(props) {
  if (!props.short_name) return props.name || "Building";
  if (!props.name || props.name === props.short_name) return props.short_name;
  return `${props.short_name} - ${props.name}`;
}

function buildingPopupHtml(props) {
  const live = state.realtimeByBuilding[String(props.short_name || "").toUpperCase()];
  const electricity = live ? live.electricityHourlyKwh : props.electricity_metric ?? props.load_kw;
  const cooling = live ? live.coolingHourlyKwh : props.cooling_metric ?? props.cooling_kw;
  const water = live ? live.waterM3 : props.water_metric ?? props.water_m3_today;
  const pv = live ? live.pvKw : props.pv_metric ?? props.solar_kw;
  const eui = props.eui ?? props.mapbox_eui_2023;
  const height = Number(props.mapbox_height_m);
  return `
    <article class="popup-card">
      <header class="popup-card-header">
        <span>${props.short_name || "NUS"}</span>
        <h4>${popupTitle(props)}</h4>
        <p>${props.zone || "NUS Campus"} / ${props.type || "Building"}</p>
      </header>
      ${props.selected_footprint_name ? `<p class="popup-inline"><strong>Footprint</strong>${props.selected_footprint_name}</p>` : ""}
      ${props.child_summary ? `<p class="popup-inline"><strong>Blocks</strong>${props.child_summary}</p>` : ""}
      <div class="popup-metrics">
        <div><span>Electricity</span><strong>${formatMetric(electricity, live ? "kWh/h" : "kW", 1)}</strong></div>
        <div><span>Cooling</span><strong>${formatMetric(cooling, live ? "kWh/h" : "kW", 1)}</strong></div>
        <div><span>Water</span><strong>${formatMetric(water, "m3", 1)}</strong></div>
        <div><span>PV</span><strong>${live ? formatLivePvMetric(pv) : formatMetric(pv, "kW", 0)}</strong></div>
      </div>
      <div class="popup-meta">
        <span>Height: ${Number.isFinite(height) ? `${formatNumber(height, 1)} m` : "No data"}</span>
        <span>EUI: ${formatMetric(eui, "kWh/m2-yr", 0)}</span>
        ${props.mapbox_building_type ? `<span>Mapbox type: ${props.mapbox_building_type}</span>` : ""}
      </div>
    </article>
  `;
}

function zoomToFeature(feature, maxZoom = 16.5) {
  if (!state.map) return;
  if (feature.geometry.type === "Point") {
    state.map.easeTo({
      center: feature.geometry.coordinates,
      zoom: maxZoom,
      pitch: 54,
      bearing: -24,
      duration: 700,
    });
    return;
  }
  const coordinates = feature.geometry.coordinates[0];
  const bounds = coordinates.reduce(
    (box, coordinate) => box.extend(coordinate),
    new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
  );
  state.map.fitBounds(bounds, {
    padding: 120,
    maxZoom,
    duration: 700,
  });
}

function applySearchFilter() {
  if (!state.map?.getLayer("building-marker-halo")) return;
  const search = state.searchTerm.toLowerCase();
  const searchFilter = search
    ? [
        "any",
        [">=", ["index-of", search, ["downcase", ["get", "name"]]], 0],
        [">=", ["index-of", search, ["downcase", ["get", "short_name"]]], 0],
        [">=", ["index-of", search, ["downcase", ["get", "zone"]]], 0],
        [">=", ["index-of", search, ["downcase", ["get", "type"]]], 0],
        [">=", ["index-of", search, ["downcase", ["get", "child_names"]]], 0],
      ]
    : null;

  const priorityFilter = ["==", ["get", "label_priority"], true];
  const pvFilter = [">", ["to-number", ["get", "pv_metric"], 0], 0];
  const layerBaseFilters = {
    "priority-marker-halo": priorityFilter,
    "priority-marker-dot": priorityFilter,
    "priority-marker-label": priorityFilter,
    "pv-markers": pvFilter,
  };
  const combineFilter = (baseFilter) => {
    if (baseFilter && searchFilter) return ["all", baseFilter, searchFilter];
    return baseFilter || searchFilter || null;
  };

  [
    "priority-marker-halo",
    "priority-marker-dot",
    "priority-marker-label",
    "building-marker-halo",
    "building-marker-dot",
    "building-marker-label",
    "building-name-label",
    "pv-markers",
  ].forEach((layer) => {
    if (!state.map.getLayer(layer)) return;
    state.map.setFilter(layer, combineFilter(layerBaseFilters[layer]));
  });
}

function setLayerVisibility(layerIds, visible) {
  layerIds.forEach((id) => {
    if (state.map?.getLayer(id)) state.map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  });
}

function addMapboxEuiLayer() {
  state.map.addSource(mapboxEuiLayer.sourceId, {
    type: "vector",
    url: mapboxEuiLayer.sourceUrl,
  });
  state.map.addLayer({
    id: "eui-context-fill",
    type: "fill",
    source: mapboxEuiLayer.sourceId,
    "source-layer": mapboxEuiLayer.sourceLayer,
    filter: campusSourceFilter(),
    layout: { visibility: els.toggleEuiLayer.checked ? "visible" : "none" },
    paint: {
      "fill-color": euiColorExpression(),
      "fill-opacity": 0.42,
    },
  });
  state.map.addLayer({
    id: "eui-context-outline",
    type: "line",
    source: mapboxEuiLayer.sourceId,
    "source-layer": mapboxEuiLayer.sourceLayer,
    filter: campusSourceFilter(),
    layout: { visibility: els.toggleEuiLayer.checked ? "visible" : "none" },
    paint: {
      "line-color": "#38424d",
      "line-opacity": 0.22,
      "line-width": 0.5,
    },
  });
}

function addMapLayers() {
  addMapboxEuiLayer();

  state.map.addSource("campus-boundary", {
    type: "geojson",
    data: campusBoundaryFeature(),
  });
  state.map.addSource("building-points", {
    type: "geojson",
    data: state.pointData,
  });
  state.map.addSource("zone-points", {
    type: "geojson",
    data: state.zoneData,
  });
  state.map.addSource("region-areas", {
    type: "geojson",
    data: state.regionAreaData,
  });
  state.map.addSource("selected-building", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  state.map.addLayer({
    id: "campus-boundary-fill",
    type: "fill",
    source: "campus-boundary",
    paint: {
      "fill-color": "#eef3f6",
      "fill-opacity": 0,
    },
  });
  state.map.addLayer({
    id: "campus-boundary-line",
    type: "line",
    source: "campus-boundary",
    paint: {
      "line-color": "#003d7c",
      "line-opacity": 0.12,
      "line-width": 1.4,
      "line-dasharray": [2, 2],
    },
  });
  state.map.addLayer({
    id: "region-area-fill",
    type: "fill",
    source: "region-areas",
    maxzoom: 15.8,
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13.8, 0.1, 15.8, 0.18],
    },
  });
  state.map.addLayer({
    id: "region-area-outline",
    type: "line",
    source: "region-areas",
    maxzoom: 15.8,
    paint: {
      "line-color": ["get", "color"],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 13.8, 0.35, 15.8, 0.75],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13.8, 1.1, 15.8, 2.3],
      "line-dasharray": [2, 1.2],
    },
  });
  state.map.addLayer({
    id: "buildings-fill",
    type: "fill",
    source: mapboxEuiLayer.sourceId,
    "source-layer": mapboxEuiLayer.sourceLayer,
    filter: campusSourceFilter(),
    paint: {
      "fill-color": buildingModelColorExpression(),
      "fill-opacity": 0.9,
    },
  });
  state.map.addLayer({
    id: "buildings-outline",
    type: "line",
    source: mapboxEuiLayer.sourceId,
    "source-layer": mapboxEuiLayer.sourceLayer,
    filter: campusSourceFilter(),
    paint: {
      "line-color": "#253744",
      "line-opacity": 0.42,
      "line-width": 0.7,
    },
  });
  state.map.addLayer({
    id: "buildings-extrusion",
    type: "fill-extrusion",
    source: mapboxEuiLayer.sourceId,
    "source-layer": mapboxEuiLayer.sourceLayer,
    filter: campusSourceFilter(),
    minzoom: 13,
    paint: {
      "fill-extrusion-color": buildingModelColorExpression(),
      "fill-extrusion-height": ["max", ["to-number", ["get", "height_m"], 6], 4],
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.94,
    },
  });
  state.map.addLayer({
    id: "zone-marker-outer",
    type: "circle",
    source: "zone-points",
    maxzoom: 15.65,
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13.5, 22, 15.65, 38],
      "circle-opacity": 0.15,
    },
  });
  state.map.addLayer({
    id: "zone-marker-middle",
    type: "circle",
    source: "zone-points",
    maxzoom: 15.65,
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13.5, 16, 15.65, 27],
      "circle-opacity": 0.28,
    },
  });
  state.map.addLayer({
    id: "zone-marker-halo",
    type: "circle",
    source: "zone-points",
    maxzoom: 15.65,
    paint: {
      "circle-color": "#ffffff",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13.5, 11, 15.65, 15],
      "circle-opacity": 0.96,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.92,
    },
  });
  state.map.addLayer({
    id: "zone-marker-dot",
    type: "circle",
    source: "zone-points",
    maxzoom: 15.65,
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13.5, 6, 15.65, 9],
    },
  });
  state.map.addLayer({
    id: "zone-count-label",
    type: "symbol",
    source: "zone-points",
    maxzoom: 15.65,
    layout: {
      "text-field": ["to-string", ["get", "count"]],
      "text-size": ["interpolate", ["linear"], ["zoom"], 13.5, 10, 15.65, 12],
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": ["get", "color"],
      "text-halo-width": 0.5,
    },
  });
  state.map.addLayer({
    id: "zone-label",
    type: "symbol",
    source: "zone-points",
    maxzoom: 15.65,
    layout: {
      "text-field": ["get", "label"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 13.5, 10, 15.65, 12],
      "text-anchor": "top",
      "text-offset": [0, 1.55],
      "text-max-width": 14,
      "text-allow-overlap": false,
      "text-optional": true,
    },
    paint: {
      "text-color": "#17202a",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.7,
    },
  });
  state.map.addLayer({
    id: "selected-outline",
    type: "circle",
    source: "selected-building",
    paint: {
      "circle-color": "rgba(0, 61, 124, 0)",
      "circle-radius": 19,
      "circle-stroke-color": "#003d7c",
      "circle-stroke-width": 4,
    },
  });
  state.map.addLayer({
    id: "pv-markers",
    type: "circle",
    source: "building-points",
    minzoom: 15.5,
    filter: [">", ["to-number", ["get", "pv_metric"], 0], 0],
    paint: {
      "circle-color": "#ef7c00",
      "circle-radius": ["interpolate", ["linear"], ["to-number", ["get", "pv_metric"], 0], 0, 4, 80, 16],
      "circle-opacity": 0.72,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
    },
  });
  state.map.addLayer({
    id: "priority-marker-halo",
    type: "circle",
    source: "building-points",
    minzoom: 15.35,
    maxzoom: 15.8,
    filter: ["==", ["get", "label_priority"], true],
    paint: {
      "circle-color": "#ffffff",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 15.35, 10, 15.8, 13],
      "circle-opacity": 0,
      "circle-stroke-color": buildingStatusColorExpression(),
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0,
    },
  });
  state.map.addLayer({
    id: "priority-marker-dot",
    type: "circle",
    source: "building-points",
    minzoom: 15.35,
    maxzoom: 15.8,
    filter: ["==", ["get", "label_priority"], true],
    paint: {
      "circle-color": buildingStatusColorExpression(),
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 15.35, 5, 15.8, 7],
      "circle-opacity": 0,
    },
  });
  state.map.addLayer({
    id: "priority-marker-label",
    type: "symbol",
    source: "building-points",
    minzoom: 15.35,
    maxzoom: 15.8,
    filter: ["==", ["get", "label_priority"], true],
    layout: {
      "text-field": ["get", "map_label"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 15.35, 9, 15.8, 10],
      "text-anchor": "center",
      "text-allow-overlap": false,
      "text-optional": true,
      "symbol-sort-key": ["get", "label_rank"],
    },
    paint: {
      "text-color": "#143c54",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8,
    },
  });
  state.map.addLayer({
    id: "building-marker-halo",
    type: "circle",
    source: "building-points",
    minzoom: 15.8,
    paint: {
      "circle-color": "#ffffff",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 15.8, 9, 17, 13],
      "circle-opacity": 0,
      "circle-stroke-color": buildingStatusColorExpression(),
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0,
    },
  });
  state.map.addLayer({
    id: "building-marker-dot",
    type: "circle",
    source: "building-points",
    minzoom: 15.8,
    paint: {
      "circle-color": buildingStatusColorExpression(),
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 15.8, 5, 17, 8],
      "circle-opacity": 0,
    },
  });
  state.map.addLayer({
    id: "building-marker-label",
    type: "symbol",
    source: "building-points",
    minzoom: 15.8,
    layout: {
      "text-field": ["get", "map_label"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 15.8, 8, 17, 10],
      "text-anchor": "center",
      "text-allow-overlap": false,
      "text-optional": true,
      "symbol-sort-key": ["get", "label_rank"],
    },
    paint: {
      "text-color": "#143c54",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8,
      "text-opacity": ["step", ["zoom"], 0, 15.8, 1],
    },
  });
  state.map.addLayer({
    id: "building-name-label",
    type: "symbol",
    source: "building-points",
    minzoom: 24,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 1.35],
      "text-max-width": 12,
      "text-allow-overlap": false,
      "text-optional": true,
      "symbol-sort-key": ["get", "label_rank"],
    },
    paint: {
      "text-color": "#17202a",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
      "text-opacity": ["step", ["zoom"], 0, 17.35, 1],
    },
  });

  state.map.on("click", "buildings-fill", (event) => {
    const feature = event.features[0];
    const catalogFeature = catalogFeatureBySourceId(feature.properties.source_id);
    const displayFeature = displayFeatureBySourceId(feature.properties.source_id);
    const mergedFeature = mergeCatalogAndMapbox(displayFeature || catalogFeature, feature.properties);
    if (mergedFeature) selectBuilding(mergedFeature);
    new mapboxgl.Popup({ maxWidth: "460px" })
      .setLngLat(event.lngLat)
      .setHTML(mapboxBuildingPopupHtml(feature.properties, catalogFeature, displayFeature))
      .addTo(state.map);
  });
  state.map.on("mouseenter", "buildings-fill", () => {
    state.map.getCanvas().style.cursor = "pointer";
  });
  state.map.on("mouseleave", "buildings-fill", () => {
    state.map.getCanvas().style.cursor = "";
  });

  [
    "priority-marker-halo",
    "priority-marker-dot",
    "priority-marker-label",
    "building-marker-halo",
    "building-marker-dot",
    "building-marker-label",
  ].forEach((layer) => {
    state.map.on("click", layer, (event) => {
      const feature = event.features[0];
      const sourceFeature =
        state.data.features.find((item) => item.properties.id === feature.properties.id) || feature;
      selectBuilding(sourceFeature);
      new mapboxgl.Popup({ maxWidth: "460px" }).setLngLat(event.lngLat).setHTML(popupHtml(sourceFeature.properties)).addTo(state.map);
    });
    state.map.on("mouseenter", layer, () => {
      state.map.getCanvas().style.cursor = "pointer";
    });
    state.map.on("mouseleave", layer, () => {
      state.map.getCanvas().style.cursor = "";
    });
  });

  ["region-area-fill", "region-area-outline"].forEach((layer) => {
    state.map.on("click", layer, (event) => {
      const feature = event.features[0];
      const region = focusRegions.find((item) => item.label === feature.properties.label);
      if (region) zoomToRegionCodes(region.codes);
    });
    state.map.on("mouseenter", layer, () => {
      state.map.getCanvas().style.cursor = "pointer";
    });
    state.map.on("mouseleave", layer, () => {
      state.map.getCanvas().style.cursor = "";
    });
  });

  [
    "zone-marker-outer",
    "zone-marker-middle",
    "zone-marker-halo",
    "zone-marker-dot",
    "zone-count-label",
    "zone-label",
  ].forEach((layer) => {
    state.map.on("click", layer, (event) => {
      const feature = event.features[0];
      const regionCodes = String(feature.properties.codes || "")
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean);
      zoomToRegionCodes(regionCodes);
    });
    state.map.on("mouseenter", layer, () => {
      state.map.getCanvas().style.cursor = "pointer";
    });
    state.map.on("mouseleave", layer, () => {
      state.map.getCanvas().style.cursor = "";
    });
  });
}

function renderLegend(metric) {
  els.legendTitle.textContent = colorModeConfig[metric].label;
  const typeItems = [
    ["#4b6edb", "Institute / academic"],
    ["#b43b34", "Healthcare"],
    ["#df7a2f", "Commercial / office"],
    ["#3b8f65", "Residential"],
    ["#2f9ab7", "Sports / civic"],
    ["#7357b8", "Industrial / utility"],
  ];
  if (metric === "type") {
    els.legendScale.classList.add("hidden");
    els.legendLabels.classList.add("hidden");
    els.legendItems.classList.remove("hidden");
    els.legendItems.innerHTML = typeItems
      .map(([color, label]) => `<span><i style="background:${color}"></i>${label}</span>`)
      .join("");
    return;
  }
  if (metric === "live") {
    els.legendScale.classList.add("hidden");
    els.legendLabels.classList.add("hidden");
    els.legendItems.classList.remove("hidden");
    els.legendItems.innerHTML = `
      <span><i style="background:#003d7c"></i>Live endpoint mapped</span>
      <span><i style="background:#6f8d9c"></i>Catalogued building</span>
    `;
    return;
  }
  els.legendItems.classList.add("hidden");
  els.legendScale.classList.remove("hidden");
  els.legendLabels.classList.remove("hidden");
  els.legendLabels.firstElementChild.textContent = metric === "height" ? "Low" : "Low";
  els.legendLabels.lastElementChild.textContent = metric === "height" ? "High" : "High";
}

function updateMetric(metric) {
  state.metric = metric;
  renderLegend(metric);
  els.metricButtons.forEach((button) => {
    const active = button.dataset.metric === metric;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (!state.map?.getLayer("buildings-fill")) return;
  const colorByMode = {
    type: buildingModelColorExpression(),
    eui: euiColorExpression(),
    height: heightColorExpression(),
    live: liveMappingColorExpression(),
  };
  const buildingColor = colorByMode[metric] || buildingModelColorExpression();
  state.map.setPaintProperty("buildings-fill", "fill-color", buildingColor);
  state.map.setPaintProperty("buildings-extrusion", "fill-extrusion-color", buildingColor);
  state.map.setPaintProperty("buildings-extrusion", "fill-extrusion-height", ["max", ["to-number", ["get", "height_m"], 6], 4]);
}

function fitCampus() {
  els.toggleEuiLayer.checked = false;
  setLayerVisibility(["eui-context-fill", "eui-context-outline"], false);
  if (!state.map) return;
  const bounds = campusFocusBounds();
  state.map.fitBounds(bounds, {
    padding: { top: 22, right: 28, bottom: 22, left: 28 },
    maxZoom: campusOverview.zoom,
    duration: 700,
    pitch: campusOverview.pitch,
    bearing: campusOverview.bearing,
  });
  state.map.once("moveend", () => {
    if (!state.map) return;
    const currentZoom = state.map.getZoom();
    if (currentZoom < campusOverview.zoom - 0.02) {
      state.map.easeTo({
        center: bounds.getCenter(),
        zoom: campusOverview.zoom,
        pitch: campusOverview.pitch,
        bearing: campusOverview.bearing,
        duration: 280,
      });
    }
  });
}

function bindControls() {
  els.tabButtons.forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
  els.externalDataButtons.forEach((button) => {
    button.addEventListener("click", () => renderExternalDataPanel(button.dataset.external));
  });
  els.externalContextClose?.addEventListener("click", () => setExternalPanelOpen(false));
  els.aiHealthRefresh?.addEventListener("click", () => {
    state.aiHealthCache = null;
    renderAiHealthMonitor({ force: true });
  });
  els.aiAgentPromptForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = els.aiAgentPromptInput?.value || "";
    submitAiAgentPrompt(prompt);
    if (els.aiAgentPromptInput) els.aiAgentPromptInput.value = "";
  });
  els.aiAgentSuggestions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-agent-prompt]");
    if (!button) return;
    submitAiAgentPrompt(button.dataset.agentPrompt);
  });
  els.metricButtons.forEach((button) => button.addEventListener("click", () => updateMetric(button.dataset.metric)));
  els.toggleBuildings.addEventListener("change", (event) => {
    setLayerVisibility(["buildings-fill", "buildings-outline", "buildings-extrusion"], event.target.checked);
  });
  els.toggleLabels.addEventListener("change", (event) => {
    setLayerVisibility(
      [
        "region-area-fill",
        "region-area-outline",
        "zone-marker-outer",
        "zone-marker-middle",
        "zone-marker-halo",
        "zone-marker-dot",
        "zone-count-label",
        "zone-label",
        "priority-marker-halo",
        "priority-marker-dot",
        "priority-marker-label",
        "building-marker-halo",
        "building-marker-dot",
        "building-marker-label",
        "building-name-label",
      ],
      event.target.checked,
    );
  });
  els.togglePv.addEventListener("change", (event) => {
    setLayerVisibility(["pv-markers"], event.target.checked);
  });
  els.toggleEuiLayer.addEventListener("change", (event) => {
    setLayerVisibility(["eui-context-fill", "eui-context-outline"], event.target.checked);
    updateMetric(state.metric);
  });
  els.buildingSearch.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim();
    applySearchFilter();
    renderBuildingList();
  });
  els.campusView.addEventListener("click", () => {
    closeTrendModal();
    closeBrickModal();
    fitCampus();
  });
  els.mapRealtimeView?.addEventListener("click", () => {
    if (els.trendModal?.classList.contains("hidden")) openTrendModal(state.activeHistoryKey || "electricity");
    else closeTrendModal();
  });
  els.mapBrickView?.addEventListener("click", () => {
    if (els.brickModal?.classList.contains("hidden")) openBrickModal();
    else closeBrickModal();
  });
  els.trendPlaceSelect?.addEventListener("change", (event) => {
    state.activeRealtimeBuilding = event.target.value;
    renderTrendChart(state.activeHistoryKey || "electricity");
  });
  els.brickPlaceSelect?.addEventListener("change", (event) => {
    state.activeBrickBuilding = event.target.value;
    state.activeBrickNodeId = "sde4";
    renderBrickGraph();
  });
  els.zoomSelected.addEventListener("click", () => {
    const feature = state.displayFeatures?.find((item) => item.properties.id === state.selectedId);
    if (feature) zoomToFeature(feature);
  });
  els.trendView?.addEventListener("click", () => openTrendModal(state.activeHistoryKey || "electricity"));
  els.trendClose?.addEventListener("click", closeTrendModal);
  els.brickClose?.addEventListener("click", closeBrickModal);
  els.trendModal?.addEventListener("click", (event) => {
    if (event.target === els.trendModal) closeTrendModal();
  });
  els.brickModal?.addEventListener("click", (event) => {
    if (event.target === els.brickModal) closeBrickModal();
  });
  els.trendTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-key]");
    if (button) renderTrendChart(button.dataset.historyKey);
  });
  els.brickGraph?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-brick-node]");
    if (!button) return;
    state.activeBrickNodeId = button.dataset.brickNode;
    renderBrickGraph();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.trendModal?.classList.contains("hidden")) closeTrendModal();
    if (event.key === "Escape" && !els.brickModal?.classList.contains("hidden")) closeBrickModal();
  });
  els.resetToken?.addEventListener("click", () => {
    localStorage.removeItem("nus-emis-mapbox-token");
    window.location.reload();
  });
}

function fallBackToDefaultMapboxToken() {
  if (state.mapAuthFallbackInProgress) return;
  if (!defaultMapboxPublicToken) {
    showTokenPanel("No site Mapbox token is configured. Paste a temporary public token to load the map.");
    return;
  }
  state.mapAuthFallbackInProgress = true;
  localStorage.removeItem("nus-emis-mapbox-token");
  setRealtimeStatus("loading", "Using site Mapbox token");
  initMap(defaultMapboxPublicToken, "fallback").catch((error) => {
    console.error(error);
    state.mapAuthFallbackInProgress = false;
    showTokenPanel(
      error.message || "The configured site Mapbox token failed. Ask the site owner to check token restrictions.",
    );
  });
}

async function initMap(token, tokenSource = "default") {
  if (typeof mapboxgl === "undefined") {
    throw new Error("Mapbox GL could not be loaded. Refresh the page and try again.");
  }

  state.activeMapboxToken = token;
  state.activeMapboxTokenSource = tokenSource;
  window.clearInterval(state.refreshTimer);
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  hideTokenPanel();
  await loadData();

  mapboxgl.accessToken = token;
  state.map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [103.776, 1.2987],
    zoom: 15.05,
    pitch: 0,
    bearing: 0,
  });

  state.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
  state.map.addControl(new mapboxgl.ScaleControl({ maxWidth: 140, unit: "metric" }), "bottom-right");
  state.map.on("error", (event) => {
    const message = String(event?.error?.message || "");
    const isAuthError = /token|auth|not authorized|forbidden|401|403/i.test(message);
    if (isAuthError) {
      localStorage.removeItem("nus-emis-mapbox-token");
      if (!isDefaultMapboxToken(token)) {
        fallBackToDefaultMapboxToken();
        return;
      }
      state.mapAuthFallbackInProgress = false;
      showTokenPanel("The configured site Mapbox token was rejected. Ask the site owner to check domain restrictions or use a temporary public token.");
    } else if (message) {
      setRealtimeStatus("error", "Map service warning");
      console.warn(event.error);
    }
  });
  state.map.on("load", async () => {
    state.mapAuthFallbackInProgress = false;
    addMapLayers();
    applySearchFilter();
    updateMetric(state.metric);
    fitCampus();
    await loadRealtime().catch((error) => {
      console.error(error);
      setRealtimeStatus("error", "Realtime API unavailable");
    });
    window.clearInterval(state.refreshTimer);
    state.refreshTimer = window.setInterval(() => {
      loadRealtime().catch((error) => {
        console.error(error);
        setRealtimeStatus("error", "Realtime API unavailable");
      });
    }, realtimeConfig.refreshMs);
  });
}

els.tokenForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = els.tokenInput.value.trim();
  if (!token) return;
  if (!token.startsWith("pk.")) {
    showTokenPanel("Paste a Mapbox public token that starts with pk.");
    return;
  }
  localStorage.setItem("nus-emis-mapbox-token", token);
  initMap(token, "manual").catch((error) => {
    console.error(error);
    localStorage.removeItem("nus-emis-mapbox-token");
    showTokenPanel(error.message || "Map failed to load. The site token will be used after refresh.");
  });
});

bindControls();

const initialMapboxToken = getInitialMapboxToken();
if (initialMapboxToken.token) {
  initMap(initialMapboxToken.token, initialMapboxToken.source).catch((error) => {
    console.error(error);
    if (!isDefaultMapboxToken(initialMapboxToken.token)) {
      fallBackToDefaultMapboxToken();
      return;
    }
    showTokenPanel(error.message || "The configured site Mapbox token failed. Ask the site owner to check token restrictions.");
  });
} else {
  showTokenPanel("No site Mapbox token is configured. Paste a temporary public token to load the map.");
}
