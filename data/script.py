import json

def replace_null_with_minus_one(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if value is None:
                data[key] = -1
            elif isinstance(value, (dict, list)):
                replace_null_with_minus_one(value)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            if item is None:
                data[i] = -1
            elif isinstance(item, (dict, list)):
                replace_null_with_minus_one(item)

def main():
    # Path to your input GeoJSON file
    input_geojson_file = "data/eu_country_nuclear_pct.geojson"
    # Path to your output GeoJSON file
    output_geojson_file = "data/eu_country_nuclear_pct_no_nulls.geojson"

    with open(input_geojson_file, 'r') as f:
        geojson_data = json.load(f)

    # Make a deep copy of the original data to preserve it
    modified_geojson_data = geojson_data.copy()

    # Replace null values with -1 in the modified data
    replace_null_with_minus_one(modified_geojson_data)

    # Write the modified data to the output GeoJSON file
    with open(output_geojson_file, 'w') as f:
        json.dump(modified_geojson_data, f, indent=4)

    print("Null values replaced with -1 in the GeoJSON file and saved to", output_geojson_file)

if __name__ == "__main__":
    main()
