import os

with open('temp_sidebar.tsx', 'r', encoding='utf-16le') as f:
    old_content = f.read()

# Find the Primary Color block
start = old_content.rfind('<div id="sidebar-color">') # The second one
if start != -1:
    end = old_content.find('<div id="preloader-menu">', start)
    if end != -1:
        block = old_content[start:end].rstrip()
        
        with open('src/Components/Common/RightSidebar.tsx', 'r', encoding='utf-8') as f2:
            new_content = f2.read()
            
        new_content = new_content.replace('{/* Primary Color selector removed per user request */}', block)
        
        with open('src/Components/Common/RightSidebar.tsx', 'w', encoding='utf-8') as f3:
            f3.write(new_content)
        print('Block restored')
        exit(0)

print('Block not found')
exit(1)
