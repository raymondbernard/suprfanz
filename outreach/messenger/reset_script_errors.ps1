# Reset bad profiles that had script syntax errors back to pending
$csv = Import-Csv fbfriends.csv

# Find profiles with syntax errors (script bugs, not real profile issues)
$toReset = $csv | Where-Object {
    $_.message_sent -eq 'bad' -and 
    $_.last_error -like '*SyntaxError*'
}

Write-Host "Found $($toReset.Count) profiles with SyntaxError to reset"

# Reset them
foreach ($row in $csv) {
    if ($row.message_sent -eq 'bad' -and $row.last_error -like '*SyntaxError*') {
        $row.message_sent = ''
        $row.last_error = ''
    }
}

# Write back
$csv | Export-Csv fbfriends.csv -NoTypeInformation -Encoding UTF8
Write-Host "Done. Updated fbfriends.csv"

# Show new counts
$csv2 = Import-Csv fbfriends.csv
$sent = ($csv2 | Where-Object {$_.message_sent -eq 'true'}).Count
$bad = ($csv2 | Where-Object {$_.message_sent -eq 'bad'}).Count
$pending = ($csv2 | Where-Object {$_.message_sent -eq '' -or $null -eq $_.message_sent}).Count
Write-Host "New totals: Sent=$sent, Bad=$bad, Pending=$pending"
