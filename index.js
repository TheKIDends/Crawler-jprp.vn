const rp = require("request-promise");
const cheerio = require("cheerio");
const request = require('request');
const fs = require("fs");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//file chứa ds link
const dslink = "dslink.txt";

//lưu danh sách link thành mảng
var arrayLink = fs.readFileSync(dslink).toString().split("\n");

async function crawler() {
    // await sleep(1000);
    let names = [];
    let authors = [];
    let publishedDates = [];
    let issues = [];

    for (i in arrayLink) {
        const linkchay = arrayLink[i];
        try {
            const options = {
                uri: linkchay,
                transform: function (body) {
                    //Khi lấy dữ liệu từ trang thành công nó sẽ tự động parse DOM
                    return cheerio.load(body);
                },
            };
            var $ = await rp(options);
        } catch (error) {
            console.log("Error:" + arrayLink[i]);
            return error;
        }

        /* Truy cập vào các tập */
        const posts = $(".title");
        for (let j = 0; j < posts.length; j++) {
            const post = $(posts[j]);
            const postLink = post.attr("href");

            try {
                const options = {
                    uri: postLink,
                    transform: function (body) {
                        //Khi lấy dữ liệu từ trang thành công nó sẽ tự động parse DOM
                        return cheerio.load(body);
                    },
                };
                var post$ = await rp(options);
            } catch (error) {
                console.log("Error:" + arrayLink[i]);
                return error;
            }

            /* Truy cập vào các bài báo */
            const titles = post$(".col-md-10 a");
            for (let k = 0; k < titles.length; k++) {
                const title = $(titles[k]);
                const titleLink = title.attr("href");
                names.push(title.text().replace('\t',' ').replace(/\s+/g,' ').trim());
                // console.log(title.text().trim());

                try {
                    const options = {
                        uri: titleLink,
                        transform: function (body) {
                            //Khi lấy dữ liệu từ trang thành công nó sẽ tự động parse DOM
                            return cheerio.load(body);
                        },
                    };
                    var title$ = await rp(options);
                } catch (error) {
                    console.log("Error:" + arrayLink[i]);
                    return error;
                }
                    
                let author = title$("#authorString").text();
                while (author.search(';') != -1) {
                    author = author.replace(';', ',');
                }   
                authors.push(author.replace('\t',' ').replace(/\s+/g,' ').trim());
                // console.log(author.replace('\t',' ').replace(/\s+/g,' ').trim());

                const datePublished = title$(".date-published");
                const date = datePublished.text().trim().toString().split(":");
                if (date.length > 1) {
                    publishedDates.push(date[1].replace('\t',' ').replace(/\s+/g,' ').trim());
                } else {
                    publishedDates.push("");
                }
                // console.log(date[1].trim());

                const issue = title$(".title");
                issues.push(issue.text().replace('\t',' ').replace(/\s+/g,' ').trim())
                // console.log(issue.text().trim());
                console.log("       + " + titleLink + " ------------->done");
            }
            console.log("   - " + postLink + " ------------->done");
        }

        let data = "";
        data += "STT;Tên bài báo;Tác giả;Ngày xuất bản;Tên số báo\n";
        for (let j = 0; j < names.length; j++) {
            const id = j + 1;
            data += id.toString() + ";" + names[j] + ";"  + authors[j] + ";" + publishedDates[j] + ";" + issues[j] + ";\n";
        }
        // Lưu dữ liệu về máy
        fs.writeFile('data.csv', data, {}, function(err){
            console.log('Ghi file xong!');
        });

        console.log(linkchay + " ------------->done");
    }
};

//call crawler
crawler();