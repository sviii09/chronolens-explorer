#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Clean up the updated_data.csv file"""

import pandas as pd

csv_path = 'src/updated_data.csv'
df = pd.read_csv(csv_path)

print('Original columns:', df.columns.tolist())
print('Original shape:', df.shape)

# Clean unnamed columns
df = df.drop(columns=[c for c in df.columns if 'Unnamed' in c], errors='ignore')

# Save back
df.to_csv(csv_path, index=False)

print('Cleaned columns:', df.columns.tolist())
print('Final shape:', df.shape)
print('✓ Saved to:', csv_path)
