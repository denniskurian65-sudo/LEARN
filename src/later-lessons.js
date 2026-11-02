import { exampleOutputs } from './example-outputs.js';
// Each prefix is copied into the editor. Every lesson works by itself.
const table = `import pandas as pd\ntrees = [\n    {"TREEID": 101, "SPECIES_NAME": "Norway Maple", "SPECIES_GENUS": "Acer", "MAP_DBH_CM": 52, "OWNERSHIP": "CITY", "STATUS": "ACTIVE"},\n    {"TREEID": 102, "SPECIES_NAME": "Blue Spruce", "SPECIES_GENUS": "Picea", "MAP_DBH_CM": 35, "OWNERSHIP": "CITY", "STATUS": "ACTIVE"},\n    {"TREEID": 103, "SPECIES_NAME": "Norway Maple", "SPECIES_GENUS": "Acer", "MAP_DBH_CM": 45, "OWNERSHIP": "CITY", "STATUS": "ACTIVE"},\n    {"TREEID": 104, "SPECIES_NAME": "Green Ash", "SPECIES_GENUS": "Fraxinus", "MAP_DBH_CM": 60, "OWNERSHIP": "CITY", "STATUS": "REMOVED"},\n    {"TREEID": 105, "SPECIES_NAME": "Sugar Maple", "SPECIES_GENUS": "Acer", "MAP_DBH_CM": 42, "OWNERSHIP": "CITY", "STATUS": "ACTIVE"},\n    {"TREEID": 106, "SPECIES_NAME": "Norway Maple", "SPECIES_GENUS": "Acer", "MAP_DBH_CM": 40, "OWNERSHIP": "CITY", "STATUS": "ACTIVE"}\n]\ndf = pd.DataFrame(trees)\n`;
const points = `${table}import geopandas as gpd\n# Invented points near Kitchener. These are not surveyed tree locations.\nlongitude = [-80.495, -80.494, -80.490, -80.489, -80.487, -80.486]\nlatitude = [43.450, 43.451, 43.452, 43.453, 43.454, 43.455]\ngdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(longitude, latitude), crs="EPSG:4326")\n`;
const projected = `${points}local = gdf.to_crs("EPSG:26917")\n`;
const parks = `import geopandas as gpd\nfrom shapely.geometry import box, Point\n# Invented rectangles, in metres. Names and column structure are for practice.\nparks = gpd.GeoDataFrame(\n    {"PARK": ["CLOVERDALE PARK", "PRACTICE PARK"],\n     "CATEGORY": ["NEIGHBOURHOOD PARK", "PRACTICE AREA"]},\n    geometry=[box(540000, 4810000, 540100, 4810200),\n              box(541000, 4810000, 541200, 4810100)],\n    crs="EPSG:26917"\n)\n`;
const wards = `${table}import geopandas as gpd\nfrom shapely.geometry import box\n# Invented wards and tree locations. These are not City boundaries.\nwards = gpd.GeoDataFrame({"WARD": ["Practice West", "Practice East"]},\n    geometry=[box(540000, 4810000, 540500, 4810500),\n              box(540500, 4810000, 541000, 4810500)], crs="EPSG:26917")\nxs = [540100, 540200, 540300, 540600, 540700, 540800]\nys = [4810100, 4810200, 4810300, 4810100, 4810200, 4810300]\nlocal = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(xs, ys), crs=wards.crs)\n`;
const canopy = `${wards}# Invented crown radii. DBH is NOT a canopy radius.\nlocal["CROWN_RADIUS_M"] = [4, 3, 5, 6, 4, 3]\nactive = local[local["STATUS"] == "ACTIVE"].copy()\ncrowns = gpd.GeoDataFrame(active[["TREEID"]].copy(),\n    geometry=active.geometry.buffer(active["CROWN_RADIUS_M"]), crs=local.crs)\n`;

const items = [];
function add(day, slug, title, story, paragraphs, prefix, body, task, hint, solution, question, options, correct = 0, mission = false) {
  const id = `d${day}-${slug}`;
  items.push({ id, day, title, story, paragraphs, code: prefix + body, output: exampleOutputs[id], task, hint, answer: prefix + solution, question, options, correct, mission, minutes: mission ? 10 : 6 });
}

add(6, 'counts', 'Count without a clipboard', 'The crew wants a species count. Your dictionary tally has a table-sized cousin.',
  ['value_counts() counts repeated values in one column. It starts with the most common value.', 'You already did this with a loop and a dictionary on Day 3. Pandas handles the loop now.'], table,
  `print(df["SPECIES_NAME"].value_counts().to_string())`,
  'Count STATUS values instead of species. You should see five ACTIVE records.', 'Change the selected column to STATUS.',
  `print(df["STATUS"].value_counts().to_string())`, 'What does value_counts() count?', ['Repeated values in a column.', 'The number of columns.', 'Only missing values.']);
add(6, 'groups', 'One group, one summary', 'A colleague asks for a typical trunk size for each species.',
  ['groupby() gathers rows with the same value. mean() calculates their average.', 'round(1) keeps one decimal place. An average can hide a wide range, so keep the source records.'], table,
  `mean_dbh = df.groupby("SPECIES_NAME")["MAP_DBH_CM"].mean().round(1)\nprint(mean_dbh.to_string())`,
  'Find the maximum diameter for each species instead.', 'Replace mean() with max().',
  `max_dbh = df.groupby("SPECIES_NAME")["MAP_DBH_CM"].max()\nprint(max_dbh.to_string())`, 'Which operation finds the biggest value in each group?', ['max()', 'head()', 'len("max")']);
add(6, 'summary', 'Two facts per species', 'The report needs both a count and a mean. One table can hold both.',
  ['agg() can calculate several summaries. Here count counts non-missing diameters, while mean averages them.', 'Filter ACTIVE records first. Otherwise a removed tree can affect the report. This repeats Day 5.'], table,
  `active = df[df["STATUS"] == "ACTIVE"]\nsummary = active.groupby("SPECIES_NAME")["MAP_DBH_CM"].agg(["count", "mean"])\nprint(summary.round(1).to_string())`,
  'Add max to the summary list.', 'Use agg(["count", "mean", "max"]).',
  `active = df[df["STATUS"] == "ACTIVE"]\nsummary = active.groupby("SPECIES_NAME")["MAP_DBH_CM"].agg(["count", "mean", "max"])\nprint(summary.round(1).to_string())`, 'When should you remove REMOVED records for an active-tree report?', ['Before grouping.', 'Only after printing.', 'Never.']);
add(6, 'mission', 'Mission: the species desk report', 'Before lunch, the crew needs a count and a mean diameter for each active species.',
  ['Combine filtering, grouping, and sorting. The starter still includes every record.', 'Keep only ACTIVE rows. Then sort the summary by count from largest to smallest.'], table,
  `summary = df.groupby("SPECIES_NAME")["MAP_DBH_CM"].agg(["count", "mean"])\nprint(summary.round(1).to_string())`,
  'Report only active trees. Put the most common species first. Norway Maple should have count 3 and mean 45.7.', 'Filter first, then use sort_values("count", ascending=False).',
  `active = df[df["STATUS"] == "ACTIVE"]\nsummary = active.groupby("SPECIES_NAME")["MAP_DBH_CM"].agg(["count", "mean"])\nsummary = summary.sort_values("count", ascending=False)\nprint(summary.round(1).to_string())`, null, null, 0, true);

add(7, 'errors', 'Read the last line first', 'Python has left you a message. It is not a performance review.',
  ['A KeyError means the requested key was not found. Check spelling and capital letters.', 'try and except let this example catch a known error and show a friendly message. Real errors also appear in the output box.'], table,
  `try:\n    print(df["species_name"].head(2).to_list())\nexcept KeyError:\n    print("Check the key. This inventory uses SPECIES_NAME.")`,
  'Fix the column name so the first two species print.', 'Replace species_name with SPECIES_NAME.',
  `try:\n    print(df["SPECIES_NAME"].head(2).to_list())\nexcept KeyError:\n    print("Check the key. This inventory uses SPECIES_NAME.")`, 'What should you check after a KeyError?', ['The exact key name.', 'Your monitor brightness.', 'The map colour.']);
const messy = `import pandas as pd\ndf = pd.DataFrame({\n    "TREEID": [201, 202, 203, 204],\n    "SPECIES_NAME": [" Sugar Maple ", "Blue Spruce", "Green Ash", "Amur Maple"],\n    "MAP_DBH_CM": ["42", "unknown", "35", None],\n    "STATUS": [" active ", "ACTIVE", "removed", "ACTIVE"]\n})\n`;
add(7, 'text', 'Tidy the labels', 'Someone added spaces to ACTIVE. The computer thinks it is a different label.',
  ['str.strip() removes spaces at the edges. str.upper() uses capital letters.', 'Clean a copy of the values for analysis. Keep raw source data in a real project so you can trace changes.'], messy,
  `df["STATUS"] = df["STATUS"].str.strip().str.upper()\nprint(df["STATUS"].to_list())`,
  'Also remove spaces from SPECIES_NAME, then print that list.', 'Use df["SPECIES_NAME"].str.strip().',
  `df["STATUS"] = df["STATUS"].str.strip().str.upper()\ndf["SPECIES_NAME"] = df["SPECIES_NAME"].str.strip()\nprint(df["STATUS"].to_list())\nprint(df["SPECIES_NAME"].to_list())`, 'What does strip() remove?', ['Spaces at the text edges.', 'Every space inside the name.', 'All rows with text.']);
add(7, 'missing', 'Unknown is not zero', 'Two trunk measurements are missing or unclear. Do not turn them into tiny trees.',
  ['pd.to_numeric(..., errors="coerce") turns invalid numbers into missing values.', 'isna() finds missing values. Do not replace a missing diameter with 0 without a documented reason.'], messy,
  `df["MAP_DBH_CM"] = pd.to_numeric(df["MAP_DBH_CM"], errors="coerce")\nprint("Missing diameters:", df["MAP_DBH_CM"].isna().sum())\nprint(df[["TREEID", "MAP_DBH_CM"]].to_string(index=False))`,
  'Print only the TREEID values with missing diameters.', 'Filter using df["MAP_DBH_CM"].isna().',
  `df["MAP_DBH_CM"] = pd.to_numeric(df["MAP_DBH_CM"], errors="coerce")\nmissing = df[df["MAP_DBH_CM"].isna()]\nprint("Missing TREEIDs:", missing["TREEID"].to_list())`, 'What should unknown diameter mean here?', ['Missing, not zero.', 'A diameter of 0 cm.', 'A removed tree.']);
add(7, 'mission', 'Mission: rescue the messy clipboard', 'The crew needs clean labels and a list of records to recheck.',
  ['Use the three cleaning steps from today. Report ACTIVE records with missing diameters.', 'These rows need a recheck. Keep them visible instead of silently dropping them.'], messy,
  `print(df.to_string(index=False))`,
  'Clean STATUS and SPECIES_NAME. Convert the diameter to numbers. Print Recheck TREEIDs: [202, 204].', 'Combine an ACTIVE condition and isna() with &. Put each condition in parentheses.',
  `df["STATUS"] = df["STATUS"].str.strip().str.upper()\ndf["SPECIES_NAME"] = df["SPECIES_NAME"].str.strip()\ndf["MAP_DBH_CM"] = pd.to_numeric(df["MAP_DBH_CM"], errors="coerce")\nrecheck = df[(df["STATUS"] == "ACTIVE") & (df["MAP_DBH_CM"].isna())]\nprint("Recheck TREEIDs:", recheck["TREEID"].to_list())`, null, null, 0, true);

add(8, 'points', 'A tree gets a location', 'Your file cards are ready for a map. Today they get invented practice coordinates near Kitchener.',
  ['A point has an x and a y. For longitude and latitude, x is longitude and y is latitude.', 'points_from_xy() turns lists of coordinates into geometry. EPSG:4326 describes longitude and latitude in degrees.'], points,
  `print(gdf.geometry.iloc[0])\nprint("CRS:", gdf.crs)`,
  'Print the second point instead of the first.', 'Use iloc[1]. Positions still start at zero.',
  `print(gdf.geometry.iloc[1])\nprint("CRS:", gdf.crs)`, 'Which coordinate goes into x here?', ['Longitude.', 'Latitude.', 'Tree diameter.']);
add(8, 'geotable', 'The table with geometry', 'Your familiar table has one new column. It is the part that knows where things are.',
  ['A GeoDataFrame is a table with an active geometry column and a CRS.', 'You can still filter attributes and use head(). The skills from Day 5 come with you.'], points,
  `print(gdf[["TREEID", "SPECIES_NAME", "geometry"]].head(2).to_string(index=False))\nprint("Geometry type:", gdf.geom_type.iloc[0])`,
  'Show three rows instead of two.', 'Change head(2) to head(3).',
  `print(gdf[["TREEID", "SPECIES_NAME", "geometry"]].head(3).to_string(index=False))\nprint("Geometry type:", gdf.geom_type.iloc[0])`, 'What makes this table spatial?', ['Its geometry column and CRS.', 'Its green text.', 'A TREEID alone.']);
add(8, 'geofilter', 'Keep the active tree points', 'The crew wants locations for active trees only. You already know the filter.',
  ['A GeoDataFrame keeps its geometry when you filter rows. You do not need to rebuild each point.', 'Check the row count before mapping. A map can hide a missing row.'], points,
  `active = gdf[gdf["STATUS"] == "ACTIVE"]\nprint("Active points:", len(active))\nprint(active["TREEID"].to_list())`,
  'Keep ACTIVE Norway Maples only. Expect IDs 101, 103, and 106.', 'Combine the two conditions with & and parentheses.',
  `active = gdf[(gdf["STATUS"] == "ACTIVE") & (gdf["SPECIES_NAME"] == "Norway Maple")]\nprint("Active points:", len(active))\nprint(active["TREEID"].to_list())`, 'Does filtering remove the geometry column?', ['No. The matching rows keep geometry.', 'Yes, always.', 'Only on Tuesdays.']);
add(8, 'mission', 'Mission: the first spatial clipboard', 'Build a clean shortlist of active maples, with a point for each tree.',
  ['Combine your species filter with the geometry table. Acer is the maple genus in this sample.', 'Do not confuse a genus check with a name that contains Maple. Use the column that answers the question.'], points,
  `print("All points:", len(gdf))`,
  'Keep ACTIVE trees with SPECIES_GENUS equal to Acer. Print the four IDs and confirm the geometry type is Point.', 'Use geom_type.unique().tolist() to inspect the geometry types.',
  `maples = gdf[(gdf["STATUS"] == "ACTIVE") & (gdf["SPECIES_GENUS"] == "Acer")]\nprint("Maple TREEIDs:", maples["TREEID"].to_list())\nprint("Geometry:", maples.geom_type.unique().tolist())`, null, null, 0, true);

add(9, 'map', 'Your first dot map', 'There are six trees on your screen. The squirrel finally agrees they are points.',
  ['plot() draws the geometry. Matplotlib adds a title and labels.', 'This browser shows the figure below the code output. No basemap or outside data is needed. These are sample points.'], projected,
  `import matplotlib.pyplot as plt\nax = local.plot(color="#146b50", markersize=65)\nax.set_title("Six practice trees")\nax.set_xlabel("Easting (m)")\nax.set_ylabel("Northing (m)")\nplt.tight_layout()\nprint("Mapped points:", len(local))`,
  'Change the title to Dennis - first tree map. Run the code to redraw it.', 'Change only the text inside set_title().',
  `import matplotlib.pyplot as plt\nax = local.plot(color="#146b50", markersize=65)\nax.set_title("Dennis - first tree map")\nax.set_xlabel("Easting (m)")\nax.set_ylabel("Northing (m)")\nplt.tight_layout()\nprint("Mapped points:", len(local))`, 'What does plot() draw here?', ['The point geometry.', 'Only the TREEID text.', 'A live satellite image.']);
add(9, 'colours', 'Colour by status', 'A red or green dot is easier to read when the legend explains it.',
  ['column tells GeoPandas which attribute to show. categorical=True treats status as a set of labels.', 'legend=True adds the key. A colour without a label asks the reader to guess.'], projected,
  `import matplotlib.pyplot as plt\nax = local.plot(column="STATUS", categorical=True, legend=True, markersize=70, cmap="Set2")\nax.set_title("Practice trees by status")\nplt.tight_layout()\nprint("Status groups:", local["STATUS"].nunique())`,
  'Colour by SPECIES_GENUS instead. Update the title too.', 'Use column="SPECIES_GENUS".',
  `import matplotlib.pyplot as plt\nax = local.plot(column="SPECIES_GENUS", categorical=True, legend=True, markersize=70, cmap="Set2")\nax.set_title("Practice trees by genus")\nplt.tight_layout()\nprint("Genus groups:", local["SPECIES_GENUS"].nunique())`, 'Why include a legend?', ['It explains the colours.', 'It makes coordinates more accurate.', 'It adds more trees.']);
add(9, 'size', 'Show a number on a map', 'The crew wants to spot larger trunks. Dot size can show the recorded diameter.',
  ['markersize controls the symbol area on the screen. Here it uses twice the diameter for a readable symbol.', 'These dots are symbols. They are not measured canopy circles. A big trunk and a big canopy are different measurements.'], projected,
  `import matplotlib.pyplot as plt\nax = local.plot(markersize=local["MAP_DBH_CM"] * 2, color="#146b50", alpha=0.7)\nax.set_title("Symbol area uses DBH - not canopy")\nplt.tight_layout()\nprint("Largest DBH:", local["MAP_DBH_CM"].max())`,
  'Filter to ACTIVE records before plotting. Keep the DBH-sized symbols.', 'Make active, then use active in both plot() and markersize.',
  `import matplotlib.pyplot as plt\nactive = local[local["STATUS"] == "ACTIVE"]\nax = active.plot(markersize=active["MAP_DBH_CM"] * 2, color="#146b50", alpha=0.7)\nax.set_title("Active trees - DBH symbols, not canopy")\nplt.tight_layout()\nprint("Largest active DBH:", active["MAP_DBH_CM"].max())`, 'Do these symbols measure canopy area?', ['No. They show trunk diameter as symbols.', 'Yes. They are crown outlines.', 'Yes, if they are green.']);
add(9, 'mission', 'Mission: a map for the morning meeting', 'Show the team active tree locations and make the title do some work.',
  ['Filter ACTIVE records, colour by genus, and include a legend. Add a title that says this is practice data.', 'Finish with a printed row count. A small check beside a map is a useful habit.'], projected,
  `import matplotlib.pyplot as plt\nax = local.plot(color="grey")\nax.set_title("Trees")\nplt.tight_layout()\nprint("Mapped active trees:", len(local))`,
  'Map only ACTIVE trees, colour by genus with a legend, and title it Practice active trees. Expect 5 points.', 'Use the Day 5 filter, then column="SPECIES_GENUS", categorical=True, legend=True.',
  `import matplotlib.pyplot as plt\nactive = local[local["STATUS"] == "ACTIVE"]\nax = active.plot(column="SPECIES_GENUS", categorical=True, legend=True, markersize=70, cmap="Set2")\nax.set_title("Practice active trees")\nax.set_xlabel("Easting (m)")\nax.set_ylabel("Northing (m)")\nplt.tight_layout()\nprint("Mapped active trees:", len(active))`, null, null, 0, true);

add(10, 'crs', 'Read the coordinate label', 'Before measuring anything, check the coordinate label on the box.',
  ['A CRS tells us what coordinates mean. EPSG:4326 uses longitude and latitude in degrees.', 'NAD83 / UTM Zone 17N is EPSG:26917. It uses metres and is suitable for local practice near Kitchener.', 'Check the source datum and its realization for real survey work. A zone number alone does not guarantee the right transformation.'], points,
  `print("CRS:", gdf.crs)\nprint("Units:", gdf.crs.axis_info[0].unit_name)`,
  'Print the number of points too.', 'Use len(gdf), just like a list or DataFrame.',
  `print("CRS:", gdf.crs)\nprint("Units:", gdf.crs.axis_info[0].unit_name)\nprint("Points:", len(gdf))`, 'Can you treat a degree as one metre?', ['No. Degrees are angular units.', 'Yes, everywhere.', 'Only for trees.']);
add(10, 'transform', 'Move the coordinates, keep the place', 'The report needs metres. Change the coordinates into the local projected system.',
  ['to_crs() transforms coordinates from the known source CRS to a new CRS.', 'set_crs() labels existing coordinates. It does not transform them. Do not relabel degrees as metres.', 'Small differences between software can occur when transformation resources differ. Use approved transformations for production work.'], points,
  `local = gdf.to_crs("EPSG:26917")\nprint("CRS:", local.crs)\nprint("Units:", local.crs.axis_info[0].unit_name)\nprint("First easting:", round(local.geometry.x.iloc[0]))`,
  'Print the first northing too, rounded to whole metres.', 'Use local.geometry.y.iloc[0].',
  `local = gdf.to_crs("EPSG:26917")\nprint("CRS:", local.crs)\nprint("Units:", local.crs.axis_info[0].unit_name)\nprint("First easting:", round(local.geometry.x.iloc[0]))\nprint("First northing:", round(local.geometry.y.iloc[0]))`, 'Which method transforms coordinates?', ['to_crs()', 'set_crs()', 'head()']);
add(10, 'distance', 'Measure in metres', 'Two trees look close on the map. Let\'s measure a straight line.',
  ['distance() measures between geometries. In a metre-based projected CRS, the result is in metres.', 'This is a straight-line distance. It does not follow sidewalks or avoid fences.'], projected,
  `first = local.geometry.iloc[0]\nsecond = local.geometry.iloc[1]\nprint("Distance (m):", round(first.distance(second), 1))`,
  'Measure from the first tree to the third tree instead.', 'The third tree has position 2.',
  `first = local.geometry.iloc[0]\nthird = local.geometry.iloc[2]\nprint("Distance (m):", round(first.distance(third), 1))`, 'What kind of distance does this calculate?', ['A straight line in the projected CRS.', 'A walking route.', 'Driving time.']);
add(10, 'mission', 'Mission: a metre-ready handoff', 'Another technician needs projected tree data and one checked distance.',
  ['Transform to EPSG:26917. Keep the original longitude and latitude table available.', 'Report the CRS and the distance between the first and last trees. Round to one decimal place.'], points,
  `print("Source CRS:", gdf.crs)`,
  'Create local with to_crs(). Print its CRS and First-to-last distance (m): with the measured distance.', 'Use local.geometry.iloc[-1] for the last tree.',
  `local = gdf.to_crs("EPSG:26917")\nprint("CRS:", local.crs)\ndistance = local.geometry.iloc[0].distance(local.geometry.iloc[-1])\nprint("First-to-last distance (m):", round(distance, 1))`, null, null, 0, true);

add(11, 'area', 'A park is a shape', 'The practice parks are rectangles today. The squirrels appreciate the simple floor plan.',
  ['A polygon encloses an area. box() builds one from minimum x, minimum y, maximum x, and maximum y.', 'geometry.area returns square metres in this CRS. The invented park names and shapes are practice data.'], parks,
  `parks["AREA_M2"] = parks.geometry.area\nprint(parks[["PARK", "AREA_M2"]].to_string(index=False))`,
  'Print the total park area too. Expect 40000.0 square metres.', 'Add parks["AREA_M2"].sum().',
  `parks["AREA_M2"] = parks.geometry.area\nprint(parks[["PARK", "AREA_M2"]].to_string(index=False))\nprint("Total area (m2):", parks["AREA_M2"].sum())`, 'What units does area use here?', ['Square metres.', 'Metres.', 'Degrees.']);
add(11, 'hectares', 'Give the area useful units', 'The team prefers hectares. No need to count ten thousand tiny squares by hand.',
  ['One hectare is 10,000 square metres. Divide by 10,000 to convert.', 'A column calculation works on every row. It is the table version of your Day 4 conversion function.'], parks,
  `parks["AREA_HA"] = parks.geometry.area / 10000\nprint(parks[["PARK", "AREA_HA"]].to_string(index=False))`,
  'Print the total hectares. Expect 4.0.', 'Sum AREA_HA after calculating it.',
  `parks["AREA_HA"] = parks.geometry.area / 10000\nprint(parks[["PARK", "AREA_HA"]].to_string(index=False))\nprint("Total hectares:", parks["AREA_HA"].sum())`, 'How many square metres make one hectare?', ['10000', '100', '1000']);
add(11, 'length', 'Walk the edge', 'A park has an area and a boundary. Those are different measurements.',
  ['geometry.length returns the perimeter of a polygon. The unit is metres here.', 'For a line, length measures along the line. Area uses square units, while length uses linear units.'], parks,
  `parks["PERIMETER_M"] = parks.geometry.length\nprint(parks[["PARK", "PERIMETER_M"]].to_string(index=False))`,
  'Also print Total boundary (m): for both parks. Expect 1200.0.', 'Sum the perimeter column.',
  `parks["PERIMETER_M"] = parks.geometry.length\nprint(parks[["PARK", "PERIMETER_M"]].to_string(index=False))\nprint("Total boundary (m):", parks["PERIMETER_M"].sum())`, 'What does length measure on a polygon?', ['Its perimeter.', 'Its area.', 'Its number of trees.']);
add(11, 'mission', 'Mission: the park measurement card', 'Give each practice park an area and a boundary measurement.',
  ['Build two calculated columns and select the report fields. Keep PARK and CATEGORY so the reader knows what each row describes.', 'Round the area to two decimal places. Use clear unit names.'], parks,
  `print(parks[["PARK", "CATEGORY"]].to_string(index=False))`,
  'Print PARK, CATEGORY, AREA_HA, and PERIMETER_M. Both parks should have 2.0 hectares and 600.0 metres of boundary.', 'Use geometry.area / 10000 and geometry.length.',
  `parks["AREA_HA"] = (parks.geometry.area / 10000).round(2)\nparks["PERIMETER_M"] = parks.geometry.length\nprint(parks[["PARK", "CATEGORY", "AREA_HA", "PERIMETER_M"]].to_string(index=False))`, null, null, 0, true);

add(12, 'buffers', 'Draw the nearby area', 'The team asks what is within 800 metres of a park. Start with a straight-line buffer.',
  ['buffer(800) expands each park polygon by 800 metres in every direction.', 'This nearby area includes the park itself. It is not a walking-access result. Entrances, roads, and barriers would need more work.'], parks,
  `nearby = parks.copy()\nnearby.geometry = parks.geometry.buffer(800)\nprint("Buffers:", len(nearby))\nprint("CRS:", nearby.crs)`,
  'Change the buffer to 400 metres and print its first area in hectares, rounded to one decimal.', 'Read nearby.geometry.area.iloc[0] and divide by 10000.',
  `nearby = parks.copy()\nnearby.geometry = parks.geometry.buffer(400)\nprint("Buffers:", len(nearby))\nprint("CRS:", nearby.crs)\nprint("First buffer (ha):", round(nearby.geometry.area.iloc[0] / 10000, 1))`, 'What does this buffer measure?', ['Straight-line proximity.', 'Walking time.', 'Public entrances.']);
add(12, 'donut', 'Keep the ring outside the park', 'Today\'s donut is a geometry. It has fewer calories than the meeting snacks.',
  ['difference() keeps the part of one shape outside another. Subtract the park from its buffer to make a ring.', 'The ring covers land outside the park and up to 800 metres away. Its exact curved edge is approximated by small line segments.'], parks,
  `park = parks.geometry.iloc[0]\nring = park.buffer(800).difference(park)\nprint("Ring type:", ring.geom_type)\nprint("Ring area (ha):", round(ring.area / 10000, 1))`,
  'Make a 400 metre ring instead.', 'Change buffer(800) to buffer(400).',
  `park = parks.geometry.iloc[0]\nring = park.buffer(400).difference(park)\nprint("Ring type:", ring.geom_type)\nprint("Ring area (ha):", round(ring.area / 10000, 1))`, 'What did difference remove here?', ['The park interior.', 'All nearby land.', 'Only tree points.']);
const homes = `${parks}# Invented test locations, not homes or survey observations.\nsites = gpd.GeoDataFrame({"SITE": ["A", "B", "C"]},\n    geometry=[Point(540150, 4810100), Point(542500, 4810100), Point(540050, 4810050)], crs=parks.crs)\n`;
add(12, 'nearby', 'Test a few locations', 'A small set of invented sites will help us check the buffer before making a bigger report.',
  ['union_all() combines overlapping shapes. Use the union so a site near two parks is counted once.', 'intersects() includes the boundary. That makes a site exactly on the 800 metre edge count as nearby.'], homes,
  `nearby_area = parks.geometry.buffer(800).union_all()\nsites["NEAR_PARK"] = sites.geometry.intersects(nearby_area)\nprint(sites[["SITE", "NEAR_PARK"]].to_string(index=False))`,
  'Print the number of nearby sites. Expect 2.', 'Sum the True values in NEAR_PARK.',
  `nearby_area = parks.geometry.buffer(800).union_all()\nsites["NEAR_PARK"] = sites.geometry.intersects(nearby_area)\nprint(sites[["SITE", "NEAR_PARK"]].to_string(index=False))\nprint("Nearby sites:", sites["NEAR_PARK"].sum())`, 'Why combine overlapping buffers?', ['To avoid counting the same covered area twice.', 'To change metres to degrees.', 'To create more sites.']);
add(12, 'mission', 'Mission: the 800 metre check', 'Make a small report of the sites outside the nearby-park area.',
  ['Combine the buffers, test the sites, and select the ones outside. ~ reverses a True/False condition in Pandas.', 'Call this a proximity check. It is not a claim about safe walking access.'], homes,
  `print("Sites to check:", len(sites))`,
  'Print Outside 800 m: [\'B\'] and Nearby sites: 2. Use an 800 metre buffer.', 'Build the union, use intersects(), then select ~sites["NEAR_PARK"].',
  `nearby_area = parks.geometry.buffer(800).union_all()\nsites["NEAR_PARK"] = sites.geometry.intersects(nearby_area)\noutside = sites[~sites["NEAR_PARK"]]\nprint("Outside 800 m:", outside["SITE"].to_list())\nprint("Nearby sites:", sites["NEAR_PARK"].sum())`, null, null, 0, true);

add(13, 'wards', 'Meet the practice wards', 'Today the team sorts trees into areas. These two simple rectangles stand in for wards.',
  ['A spatial join matches by location. First check that both layers use the same CRS.', 'These ward names and boundaries are invented. They help us test the method before real data arrives.'], wards,
  `print("Tree CRS:", local.crs)\nprint("Ward CRS:", wards.crs)\nprint("Same CRS:", local.crs == wards.crs)`,
  'Also print the number of tree points and ward polygons.', 'Use len(local) and len(wards).',
  `print("Tree CRS:", local.crs)\nprint("Ward CRS:", wards.crs)\nprint("Same CRS:", local.crs == wards.crs)\nprint("Trees:", len(local))\nprint("Wards:", len(wards))`, 'What should you check before a spatial join?', ['The CRS of both layers.', 'Only the table font.', 'The order of species names.']);
add(13, 'join', 'Give each tree a ward', 'The tree records can borrow a ward name from the polygon they sit inside.',
  ['gpd.sjoin() joins attributes using a spatial rule. predicate="within" means the point must be inside the polygon.', 'how="left" keeps every tree, including unmatched ones. An unmatched ward appears as missing.'], wards,
  `joined = gpd.sjoin(local, wards[["WARD", "geometry"]], how="left", predicate="within")\nprint(joined[["TREEID", "WARD"]].to_string(index=False))`,
  'Print Unmatched trees: after the table. Expect 0.', 'Use joined["WARD"].isna().sum().',
  `joined = gpd.sjoin(local, wards[["WARD", "geometry"]], how="left", predicate="within")\nprint(joined[["TREEID", "WARD"]].to_string(index=False))\nprint("Unmatched trees:", joined["WARD"].isna().sum())`, 'What does a left join preserve here?', ['All input tree rows.', 'Only matching wards.', 'Only the biggest tree.']);
add(13, 'boundary', 'A tree on the line', 'One test point lands exactly on the shared boundary. Geography has found a corner case.',
  ['within excludes the boundary. intersects includes it.', 'On a shared edge, intersects can match two polygons. Do not silently count that tree twice. Agree on a boundary rule for a real project.'], wards,
  `from shapely.geometry import Point\nedge = gpd.GeoDataFrame({"TREEID": [999]}, geometry=[Point(540500, 4810250)], crs=wards.crs)\ninside = gpd.sjoin(edge, wards, how="inner", predicate="within")\nprint("Within matches:", len(inside))`,
  'Also run an intersects join and print its match count. Expect 2.', 'Make touching = gpd.sjoin(edge, wards, how="inner", predicate="intersects").',
  `from shapely.geometry import Point\nedge = gpd.GeoDataFrame({"TREEID": [999]}, geometry=[Point(540500, 4810250)], crs=wards.crs)\ninside = gpd.sjoin(edge, wards, how="inner", predicate="within")\ntouching = gpd.sjoin(edge, wards, how="inner", predicate="intersects")\nprint("Within matches:", len(inside))\nprint("Intersects matches:", len(touching))`, 'Why can intersects create two matches?', ['The point touches both ward polygons.', 'The tree has two species.', 'The CRS always duplicates rows.']);
add(13, 'mission', 'Mission: the ward assignment desk', 'Hand over active tree IDs with a ward name and a check for missing matches.',
  ['Filter ACTIVE records before the left spatial join. Keep the join rule explicit.', 'Review missing names. Our six practice points are inside the rectangles, so no boundary decision is needed here.'], wards,
  `print("All trees:", len(local))`,
  'Print TREEID and WARD for the five active trees. End with Unmatched trees: 0.', 'Filter first. Join using within and how="left". Check WARD for missing values.',
  `active = local[local["STATUS"] == "ACTIVE"]\njoined = gpd.sjoin(active, wards[["WARD", "geometry"]], how="left", predicate="within")\nprint(joined[["TREEID", "WARD"]].to_string(index=False))\nprint("Unmatched trees:", joined["WARD"].isna().sum())`, null, null, 0, true);

const joined = `${wards}active = local[local["STATUS"] == "ACTIVE"]\njoined = gpd.sjoin(active, wards[["WARD", "geometry"]], how="left", predicate="within")\n`;
add(14, 'ward-count', 'Count by ward', 'The team wants one row per ward instead of one row per tree.',
  ['After the spatial join, WARD is an ordinary column. Use groupby() again.', 'size() counts rows. count() counts non-missing values in a chosen column. They can differ when data are missing.'], joined,
  `counts = joined.groupby("WARD").size()\nprint(counts.to_string())`,
  'Print the total active trees from the ward counts. Expect 5.', 'Add counts.sum().',
  `counts = joined.groupby("WARD").size()\nprint(counts.to_string())\nprint("Total active trees:", counts.sum())`, 'What does groupby(...).size() count?', ['Rows in each group.', 'Only the largest diameter.', 'Polygon area.']);
add(14, 'ward-stats', 'Add diameter summaries', 'A count is useful, but the team also wants mean and maximum trunk diameter.',
  ['agg() makes several summaries. These are active tree records because the filter already ran.', 'A larger average DBH does not prove better canopy cover. Keep the measurement and the claim separate.'], joined,
  `summary = joined.groupby("WARD")["MAP_DBH_CM"].agg(["count", "mean", "max"])\nprint(summary.round(1).to_string())`,
  'Add min to the summary.', 'Use agg(["count", "mean", "max", "min"]).',
  `summary = joined.groupby("WARD")["MAP_DBH_CM"].agg(["count", "mean", "max", "min"])\nprint(summary.round(1).to_string())`, 'Does mean DBH directly measure canopy cover?', ['No. Canopy needs its own measurement.', 'Yes, in every species.', 'Only when rounded.']);
add(14, 'density', 'Compare fairly with area', 'Ten trees in a tiny ward mean something different from ten in a huge one.',
  ['Divide tree count by ward area in hectares to get trees per hectare.', 'Join counts onto the ward table by its name. Fill a missing count with 0 so empty wards remain visible.', 'Inventory density is not a full measure of all trees if the inventory misses private land or other records.'], joined,
  `counts = joined.groupby("WARD").size().rename("TREE_COUNT")\nreport = wards.join(counts, on="WARD")\nreport["TREE_COUNT"] = report["TREE_COUNT"].fillna(0).astype(int)\nreport["AREA_HA"] = report.geometry.area / 10000\nprint(report[["WARD", "TREE_COUNT", "AREA_HA"]].to_string(index=False))`,
  'Add TREES_PER_HA and print that column with the ward names. Expect 0.12 in West and 0.08 in East.', 'Divide TREE_COUNT by AREA_HA and round to 2 decimal places.',
  `counts = joined.groupby("WARD").size().rename("TREE_COUNT")\nreport = wards.join(counts, on="WARD")\nreport["TREE_COUNT"] = report["TREE_COUNT"].fillna(0).astype(int)\nreport["AREA_HA"] = report.geometry.area / 10000\nreport["TREES_PER_HA"] = (report["TREE_COUNT"] / report["AREA_HA"]).round(2)\nprint(report[["WARD", "TREES_PER_HA"]].to_string(index=False))`, 'Why divide by area?', ['It makes different-sized areas easier to compare.', 'It changes trees into canopy.', 'It removes missing coordinates.']);
add(14, 'mission', 'Mission: the ward report card', 'Make a short ward report with one row for each practice ward.',
  ['Use the active-tree join, then group the diameters. Sort by count from largest to smallest.', 'Print a total to check that all five active records are represented. These sample results describe only the invented data.'], joined,
  `print("Joined rows:", len(joined))`,
  'Print count, mean, and max for each ward. Put West first with count 3. End with Total active trees: 5.', 'Use groupby("WARD")["MAP_DBH_CM"].agg(...), then sort_values("count", ascending=False).',
  `summary = joined.groupby("WARD")["MAP_DBH_CM"].agg(["count", "mean", "max"])\nsummary = summary.sort_values("count", ascending=False)\nprint(summary.round(1).to_string())\nprint("Total active trees:", summary["count"].sum())`, null, null, 0, true);

add(15, 'crowns', 'A crown is not a trunk', 'The next question is about shade. A trunk diameter cannot tell the whole story.',
  ['Canopy cover describes the ground area under tree crowns. We need crown measurements or canopy mapping to estimate it.', 'Today we invent a separate CROWN_RADIUS_M measurement. These circles teach the method. They are not City canopy observations.', 'The tree inventory columns stay in the sample. MAP_DBH_CM is never used as a crown radius.'], canopy,
  `print("Active crowns:", len(crowns))\nprint("First crown area (m2):", round(crowns.geometry.area.iloc[0], 1))`,
  'Print the total area of the five separate crown circles, rounded to one decimal.', 'Use crowns.geometry.area.sum().',
  `print("Active crowns:", len(crowns))\nprint("First crown area (m2):", round(crowns.geometry.area.iloc[0], 1))\nprint("Separate crown area (m2):", round(crowns.geometry.area.sum(), 1))`, 'Which input describes the practice crown size?', ['CROWN_RADIUS_M, a separate invented measurement.', 'MAP_DBH_CM as a radius in metres.', 'TREEID divided by two.']);
const overlap = `import geopandas as gpd\nfrom shapely.geometry import Point, box\n# Two invented crowns that overlap. Coordinates are metres.\ncrowns = gpd.GeoSeries([Point(540010, 4810010).buffer(5),\n                        Point(540015, 4810010).buffer(5)], crs="EPSG:26917")\n`;
add(15, 'overlap', 'Do not count shade twice', 'Two neighbouring crowns overlap. The ground beneath them is still only one piece of ground.',
  ['Adding each crown area counts overlap twice. union_all() combines the shapes before measuring.', 'For canopy cover, use the area of the combined footprint. Our circle edges are approximations.'], overlap,
  `separate = crowns.area.sum()\ncombined = crowns.union_all().area\nprint("Added areas (m2):", round(separate, 1))\nprint("Union area (m2):", round(combined, 1))`,
  'Print Overcount (m2): as separate minus combined, rounded to one decimal.', 'Subtract the two area values before rounding.',
  `separate = crowns.area.sum()\ncombined = crowns.union_all().area\nprint("Added areas (m2):", round(separate, 1))\nprint("Union area (m2):", round(combined, 1))\nprint("Overcount (m2):", round(separate - combined, 1))`, 'Which area avoids double counting the overlap?', ['The union area.', 'The sum of separate areas.', 'The trunk diameter.']);
add(15, 'percent', 'Turn area into a percentage', 'The team needs a share of land covered, not just a large-looking area number.',
  ['Canopy cover percent is covered ground area divided by study area, multiplied by 100.', 'Clip the combined crowns to the study boundary with intersection(). Anything outside the boundary does not count.', 'Our tiny practice plot is 20 m by 20 m. Its area is 400 square metres.'], overlap,
  `study = box(540000, 4810000, 540020, 4810020)\ncovered = crowns.union_all().intersection(study).area\ncover_pct = covered / study.area * 100\nprint("Study area (m2):", study.area)\nprint("Canopy cover (%):", round(cover_pct, 1))`,
  'Add Covered area (m2): rounded to one decimal.', 'Print the covered variable. It already holds the clipped area.',
  `study = box(540000, 4810000, 540020, 4810020)\ncovered = crowns.union_all().intersection(study).area\ncover_pct = covered / study.area * 100\nprint("Study area (m2):", study.area)\nprint("Canopy cover (%):", round(cover_pct, 1))\nprint("Covered area (m2):", round(covered, 1))`, 'What is the denominator in canopy cover percent?', ['The study area.', 'The number of trees.', 'The sum of trunk diameters.']);
add(15, 'mission', 'Mission: shade, measured carefully', 'Write the first small canopy report. Include the number, its units, and its limits.',
  ['Combine the crowns, clip them to the practice plot, and calculate the covered percentage.', 'End with a plain note: Practice circles only. Not measured City canopy. This is a method check, not a Kitchener finding.', 'Next, Day 16 will compare wards. Days 16-21 remain roadmap items until you ask for the next batch.'], overlap,
  `study = box(540000, 4810000, 540020, 4810020)\nprint("Study area (m2):", study.area)`,
  'Print Study area (m2), Covered area (m2), and Canopy cover (%) to one decimal place. Add the practice-data note.', 'Use union_all().intersection(study).area. Divide by study.area and multiply by 100.',
  `study = box(540000, 4810000, 540020, 4810020)\ncovered = crowns.union_all().intersection(study).area\nprint("Study area (m2):", round(study.area, 1))\nprint("Covered area (m2):", round(covered, 1))\nprint("Canopy cover (%):", round(covered / study.area * 100, 1))\nprint("Practice circles only. Not measured City canopy.")`, null, null, 0, true);

export const laterLessons = items;
