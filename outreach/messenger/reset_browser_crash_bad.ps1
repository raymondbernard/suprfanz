# Reset bad profiles that had browser crashes back to pending
$csv = Import-Csv fbfriends.csv
$fnames = $csv | Get-Member -MemberType NoteProperty | Select-Object -Expand Name

# Find profiles with browser crash errors
$toReset = $csv | Where-Object {
    $_.message_sent -eq 'bad' -and 
    $_.last_error -like '*Target page, context or browser has been*'
}

Write-Host "Found $($toReset.Count) profiles to reset"

# Reset them
foreach ($row in $csv) {
    if ($row.message_sent -eq 'bad' -and $row.last_error -like '*Target page, context or browser has been*') {
        $row.message_sent = ''
        $row.last_error = ''
    }
}

# Write back
$csv | Export-Csv fbfriends.csv -NoTypeInformation -Encoding UTF8
Write-Host "Done. Updated fbfriends.csv"
