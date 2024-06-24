import datetime
import pytz

# Given date
given_date = datetime.datetime(2024, 6, 1)

# Timezone
timezone = pytz.timezone('Asia/Singapore')  # Example: Singapore timezone

# Localize the given date to the specified timezone
localized_date = timezone.localize(given_date).strftime('%Y-%m-%d %H:%M:%S %z')

# Convert the localized date to a timestamp


print("Given Date:", localized_date)
