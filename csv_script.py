import csv

def transform_csv(input_csv, output_csv, start_year=1965, end_year=2022):
    """
    Transform a CSV file to have headers for every year from start_year to end_year,
    with values from the 'Nuclear_Pct' column under the associated year column.
    
    Parameters:
        input_csv (str): Filename of the input CSV file.
        output_csv (str): Filename of the output transformed CSV file.
        start_year (int): The starting year (default is 1965).
        end_year (int): The ending year (default is 2022).
    """
    # Create headers
    headers = ['Country', 'Code'] + [str(year) for year in range(start_year, end_year + 1)]
    
    # Read data and transform
    transformed_data = {}
    with open(input_csv, 'r', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            country = row['Country']
            code = row['Code']
            nuclear_pct = row['Nuclear_Pct']
            if country not in transformed_data:
                transformed_data[country] = {'Country': country, 'Code': code}
            transformed_data[country][row['Year']] = nuclear_pct
    
    # Write transformed data to output CSV
    with open(output_csv, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        writer.writerows(transformed_data.values())

# Example usage:
input_csv = 'filtered_data.csv'  # Replace with your input CSV filename
output_csv = 'output.csv'  # Replace with the desired output CSV filename
transform_csv(input_csv, output_csv)
