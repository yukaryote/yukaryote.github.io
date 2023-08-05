from markdown2 import markdown
from jinja2 import Environment, FileSystemLoader
from json import load

template_env = Environment(loader=FileSystemLoader(searchpath="./"))
template = template_env.get_template('layout.html')

with open('index.md') as md_file:
    article = markdown(
        md_file.read(),
        extras=['fenced_code_blocks', 'code-friendly']
    )

with open('config.json') as cfg_file:
    cfg = load(cfg_file)
    print(cfg)

with open('index2.html', 'w') as output_file:
    output_file.write(
        template.render(
            title=cfg['title'],
            article=article
        )
    )