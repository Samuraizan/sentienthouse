import json, sys

# Load menu prices
with open('/tmp/menu_prices.json') as f:
    menu = json.load(f)

# Build lookup (lowercase name -> price)
prices = {}
for item in menu:
    prices[item['item_name'].lower().strip()] = item['price']

# Fudr name -> menu_items name mapping
aliases = {
    'watermelon juice': 'water melon juice',
    'banana milk shake': 'banana shake',
    'ice tea': 'iced tea',
    'veg sandwich': 'veg club sandwich',
    'dal rice': 'dal rice bowl',
    'garlic noodles': 'garlic noodles - veg',
    'chicken burrito bowl': 'non- veg burrito bowl',
    'cappuccino': 'cappucino',
    'maggi of choice': 'maggie',
    'lunch': None,       # combo meal, use order amount
    'dinner': None,      # combo meal, use order amount
    'breakfast': None,   # combo meal, use order amount
}

# Load orders
orders_data = json.load(sys.stdin)
orders = orders_data['orders']

rows = []
unmatched = set()

for order in orders:
    for item in order['items']:
        name_lower = item['name'].lower().strip()

        # Check if it's a combo (lunch/dinner/breakfast)
        if name_lower in ('lunch', 'dinner', 'breakfast'):
            price = ''  # combo price varies, leave blank
        else:
            # Try direct match
            price = prices.get(name_lower)

            # Try alias
            if price is None:
                alias = aliases.get(name_lower)
                if alias:
                    price = prices.get(alias.lower())

            # Try partial match
            if price is None:
                for menu_name, menu_price in prices.items():
                    if name_lower in menu_name or menu_name in name_lower:
                        price = menu_price
                        break

            if price is None:
                unmatched.add(name_lower)
                price = ''

        row = [
            order['orderId'],
            order['orderDate'],
            order['orderTime'],
            order['guest'],
            order['phone'],
            order['location'],
            item['name'],
            item['variant'],
            int(item['qty']),
            price if price != '' else '',
            int(order['amount']),
            order['payment'],
            'combo' if name_lower in ('lunch', 'dinner', 'breakfast') else ''
        ]
        rows.append(row)

result = {'totalRows': len(rows), 'unmatched': sorted(list(unmatched)), 'rows': rows}
print(json.dumps(result))
