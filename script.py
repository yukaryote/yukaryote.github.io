import os
from datetime import datetime
from pathlib import Path
from shutil import copytree, rmtree
from markdown2 import markdown
from jinja2 import Environment, FileSystemLoader

markdown_dir = Path('./markdown').resolve()
output_dir = Path('./output').resolve()
layout_dir = Path('./layouts').resolve()

def make_site():
    rmtree(output_dir)
    
    if not os.path.exists(output_dir.joinpath('writing')):
        os.makedirs(output_dir.joinpath('writing'))

    if not os.path.exists(output_dir.joinpath('projects')):
        os.makedirs(output_dir.joinpath('projects'))

    if not os.path.exists(output_dir.joinpath('art')):
        os.makedirs(output_dir.joinpath('art'))

    all_posts = []
    for post_path in markdown_dir.glob('posts/*.md'):
        all_posts.append(post_path.relative_to(markdown_dir))
    
    posts_list = []
    for post in all_posts:
        posts_list.append(make_post(post))

    posts_list.sort(key=lambda x: x['date'], reverse=True)
    for i, post in enumerate(posts_list):
        format_date = posts_list[i]['date'].strftime('%mm-%dd-%Y')
        posts_list[i]['date'] = format_date

    make_index(posts_list)

def make_index():
    env = Environment(loader=FileSystemLoader(layout_dir))
    template = env.get_template("index_template.html")

    input_page = markdown_dir.joinpath(Path('index.md'))
    output_page = output_dir.joinpath(Path('index.html'))

    with open(input_page, 'r') as file:
        parsed_md = markdown(file.read(), extras=['metadata', 'footnotes'])
    
    try: post_title = parsed_md.metadata['title']
    except: post_title = ''
    print(parsed_md)

    page = {
        'title': post_title,
        'content': parsed_md
    }

    html = template.render(post=page)

    with open(output_page, 'w', encoding='utf-8') as file: 
        file.write(html)

def make_post(post_path):
    post_relative_path = str(post_path).split('.')[0]
    env = Environment(loader=FileSystemLoader(layout_dir))
    template = env.get_template('post_template.html')

    input_page = markdown_dir.joinpath(Path(post_relative_path + '.md'))

    with open(input_page, 'r') as file:
        parsed_md = markdown(file.read(), extras=['metadata', 'footnotes'])

    try: post_date = datetime.strptime(parsed_md.metadata['date'], '%mm-%dd-%Y')
    except: post_date = datetime(1999, 1, 1)
    try: post_title = parsed_md.metadata['title']
    except: post_title = ''
    try: post_string = parsed_md.metadata['string']
    except: post_string = ''

    post = {
        'title': post_title,
        'date': post_date.strftime('%Y-%m-%d'),
        'content': parsed_md
    }

    html = template.render(post=post)

    if not os.path.exists(output_dir.joinpath('posts/' + post_string)):
        os.makedirs(output_dir.joinpath('posts/' + post_string))
    output_page = output_dir.joinpath(Path('posts/' + post_string + '.html'))

    with open(output_page, 'w', encoding='utf-8') as file: 
        file.write(html)

    return {'title': post_title, 'date': post_date, 'string': post_string}

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--make_site", default=False, help="make the entire site")
    parser.add_argument("--home", action="store_true", help="path to markdown file to make the home page")
    parser.add_argument("--post", default="", type=str, help="path to markdown file to make a post")
    parser.add_argument("--project", default="", type=str, help="path to markdown file to make a project doc")
    parser.add_argument("--art", default="", help="path to images to add art to gallery")

    args = parser.parse_args()

    if args.make_site:
        make_site()
    elif args.home:
        make_index()
    if args.post:
        make_post(args.post)
    if args.project:
        make_post(args.project)
    if args.art:
        make_post(args.art)