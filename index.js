const template = document.createElement('template');

template.innerHTML = `
<div class="header">
<div class="name">

    <h1>Isabella Yu</h1>
    <img src="images/transparent.png" alt="chubby kitty" style="width:75px;height:75px;">
</div>
<div class="menu">
    <a href="/index.html">Home</a></li>
    <a href="/art/art.html">Art</a></li>
    <a href="/projects/projects.html">Projects</a></li>
    <a href="/writing/writing.html">Writing</a></li>
</div>
</div>
`;

document.body.prepend(template.content);

var lastScrollTop = 0;

$(window).scroll(function () {
  
var st = $(this).scrollTop();
        if (st < lastScrollTop){
            $('.header ').slideDown();
        } else {
          $('.header ').slideUp();
        }
        lastScrollTop = st;
  })