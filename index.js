const mineflayer = require('mineflayer');

let bot = null;
let spawnState = 0; // Biến để lưu trạng thái spawn
let spawnCount = 0; // Biến để đếm số lần spawn
let activationInterval = null; // Biến để lưu interval của activateItemContinuously

// Hàm để dừng thực thi trong một khoảng thời gian (milliseconds)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm để tạo và khởi động bot
function startBot() {
    return new Promise((resolve, reject) => {
        bot = mineflayer.createBot({
            host: 'vinamc.net',
            username: 'TrumBanDo',
            auth: 'offline',
            port: 25565,
            version: "1.20.4",
        });

        function onWindowOpen(window) {
            console.log('Đã vào server'); // Ghi log
            bot.clickWindow(11, 0, 0); // Click vào slot 11 trong cửa sổ
        }

        // Hàm để liên tục thiết lập vị trí thanh công cụ nhanh và kích hoạt vật phẩm
        async function activateItemContinuously() {
            while (spawnState === 0) {
                bot.setQuickBarSlot(0);
                bot.activateItem();
                await sleep(3500); // Chờ 3,5 giây
            }
        }

        // Hàm để dừng activateItemContinuously
        function stopActivateItemContinuously() {
            if (activationInterval) {
                clearInterval(activationInterval);
                activationInterval = null;
            }
        }

        // Hàm để gỡ bỏ tất cả các listeners của sự kiện 'windowOpen'
        function removeWindowOpenListeners() {
            bot.removeListener('windowOpen', onWindowOpen);
        }

        // Lắng nghe sự kiện khi bot xuất hiện trong thế giới
        bot.on('spawn', async () => {
            console.log(`Trạng thái spawn trước khi cập nhật: ${spawnState}`);
            spawnCount++;
            if (spawnCount === 2) {
                spawnState = 1; // Đặt thành 1 khi spawn lần thứ hai
                removeWindowOpenListeners(); // Gỡ bỏ tất cả các listeners của 'windowOpen'
            }
            console.log(`Trạng thái spawn sau khi cập nhật: ${spawnState}`); // Ghi log trạng thái spawn
            bot.setMaxListeners(5); // Tăng giới hạn listeners cho sự kiện 'windowOpen'
            bot.chat('/login thegold780'); // Gửi lệnh đăng nhập
            await sleep(4000); // Chờ 4 giây để đảm bảo đăng nhập được xử lý
            console.log('Đã nhập mật khẩu'); // Ghi log

            if (spawnState === 0) {
                if (!activationInterval) {
                    activationInterval = setInterval(activateItemContinuously, 3500); // Kích hoạt liên tục khi spawnState là 0
                }
                bot.on('windowOpen', onWindowOpen); // Thêm listener cho sự kiện 'windowOpen'
            } else if (spawnState === 1) {
                stopActivateItemContinuously(); // Dừng kích hoạt khi spawnState là 1
            }
        });

        // Lắng nghe sự kiện lỗi
        bot.on('error', (err) => {
            console.error(`Bot gặp lỗi: ${err}`);
            reject(err); // Từ chối promise khi gặp lỗi
        });

        // Lắng nghe sự kiện kết thúc (ngắt kết nối)
        bot.on('end', () => {
            console.log('Bot đã ngắt kết nối');
            spawnState = 0; // Đặt lại trạng thái spawn về 0 khi ngắt kết nối
            spawnCount = 0; // Đặt lại biến đếm spawn về 0
            stopActivateItemContinuously(); // Dừng kích hoạt liên tục khi ngắt kết nối
            resolve(); // Hoàn thành promise khi ngắt kết nối
        });

        // Lắng nghe sự kiện đăng nhập để hoàn thành promise
        bot.once('login', () => {
            console.log(`Bot đã đăng nhập thành công với tên: ${bot.username}`);
            resolve(); // Hoàn thành promise khi đăng nhập thành công
        });
    });
}

// Hàm retry để khởi động bot cho đến khi thành công
async function startBotWithRetries() {
    while (true) {
        try {
            await startBot();
            console.log('Bot đã kết nối thành công.');
            // Thêm một vòng lặp để theo dõi tình trạng kết nối và tự động thử lại nếu bị ngắt kết nối
            while (true) {
                if (!bot || !bot._client.socket || bot._client.socket.readyState !== 1) { // Kiểm tra nếu bot bị ngắt kết nối
                    console.log('Bot bị ngắt kết nối. Thử kết nối lại...');
                    break; // Thoát vòng lặp bên trong để thử kết nối lại
                }
                await sleep(3000); // Kiểm tra mỗi 3 giây
            }
        } catch (err) {
            console.error(`Lỗi khi khởi động bot: ${err}`);
        }
        console.log('Thử khởi động lại bot sau 3 giây...');
        await sleep(3000); // Chờ 3 giây trước khi thử lại
    }
}

// Khởi động bot với logic retry
startBotWithRetries();

console.log('Bạn đang dùng index 7');
