import re

name_file = open('color_names.txt')

line_re = re.compile('(\w+)\s+#\w+\s+(\d+),(\d+),(\d+)')

out_lines = []

for line in name_file.readlines():
  match = line_re.search(line)
  if not match:
    continue
  out_lines.append('  %s: { r: %s, g: %s, b: %s }' % match.groups())

print('{')
print(',\n'.join(out_lines))
print('}')
