import AVFoundation
import AVKit
import UIKit
import WebKit

// iPhone shell for the site. Radio, recitations and lectures play in the page;
// channels go to the system player, which plays http streams and needs no CORS.
let SITE = URL(string: "https://bmeshary-crypto.github.io/quran/")!

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ app: UIApplication, didFinishLaunchingWithOptions opts: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // keep audio going with the screen locked or the silent switch on
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = WebController()
        window?.makeKeyAndVisible()
        return true
    }
}

class WebController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var web: WKWebView!
    var failWatch: NSKeyValueObservation?

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func loadView() {
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        cfg.applicationNameForUserAgent = "Mobile/15E148 Safari/604.1 QuranSunnahApp"
        cfg.userContentController.add(self, name: "nativePlay")
        web = WKWebView(frame: .zero, configuration: cfg)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 11 / 255, green: 61 / 255, blue: 46 / 255, alpha: 1)
        web.scrollView.contentInsetAdjustmentBehavior = .automatic
        let refresh = UIRefreshControl()
        refresh.addTarget(self, action: #selector(reload(_:)), for: .valueChanged)
        web.scrollView.refreshControl = refresh
        view = web
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        web.load(URLRequest(url: SITE))
    }

    @objc func reload(_ c: UIRefreshControl) {
        web.load(URLRequest(url: SITE))
        c.endRefreshing()
    }

    // a channel tapped in the page
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        guard let d = m.body as? [String: Any], let s = d["url"] as? String, let url = URL(string: s) else { return }
        let item = AVPlayerItem(url: url)
        let player = AVPlayer(playerItem: item)
        let vc = AVPlayerViewController()
        vc.player = player
        failWatch = item.observe(\.status) { [weak self, weak vc] item, _ in
            guard item.status == .failed else { return }
            DispatchQueue.main.async {
                vc?.dismiss(animated: true) {
                    let a = UIAlertController(title: d["title"] as? String, message: "هذه القناة لا تبث الآن — جرّب قناة أخرى.", preferredStyle: .alert)
                    a.addAction(UIAlertAction(title: "حسنًا", style: .default))
                    self?.present(a, animated: true)
                }
            }
        }
        present(vc, animated: true) { player.play() }
    }

    // pages outside the site (and links meant for a new window) open in Safari
    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = a.request.url
        let main = a.targetFrame?.isMainFrame ?? true
        if main, let url, url.scheme?.hasPrefix("http") == true, !url.absoluteString.hasPrefix(SITE.absoluteString) {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }

    func webView(_ w: WKWebView, createWebViewWith c: WKWebViewConfiguration, for a: WKNavigationAction, windowFeatures f: WKWindowFeatures) -> WKWebView? {
        if let url = a.request.url { UIApplication.shared.open(url) }
        return nil
    }

    func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) { offline(e) }
    func webView(_ w: WKWebView, didFailProvisionalNavigation n: WKNavigation!, withError e: Error) { offline(e) }

    func offline(_ e: Error) {
        if (e as NSError).code == NSURLErrorCancelled { return }
        web.loadHTMLString("""
        <html dir="rtl"><meta name="viewport" content="width=device-width,initial-scale=1">
        <body style="background:#0b3d2e;color:#fff;font:18px -apple-system;text-align:center;padding:30vh 24px 0">
        <p>لا يوجد اتصال بالإنترنت</p><p style="opacity:.8;font-size:15px">اسحب الشاشة للأسفل لإعادة المحاولة</p>
        </body></html>
        """, baseURL: SITE)
    }
}
