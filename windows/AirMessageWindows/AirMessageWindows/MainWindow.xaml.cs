﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Web;
using Windows.ApplicationModel.Contacts;
using Windows.System;
using Microsoft.UI.Xaml;
using Microsoft.Web.WebView2.Core;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace AirMessageWindows
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            IgnoreNullValues = true
        };

        private static bool IsWebView2Installed()
        {
            try
            {
                CoreWebView2Environment.GetAvailableBrowserVersionString();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public MainWindow() {
            InitializeComponent();

            CheckWebView();
        }
        
        private void MainWindow_OnActivated(object sender, WindowActivatedEventArgs args)
        {
            //Re-check when the user activates the window again
            if (WebViewNotice.Visibility == Visibility.Visible)
            {
                CheckWebView();
            }
        }

        private void CheckWebView()
        {
            if (IsWebView2Installed())
            {
                //Initialize web view
                InitializeWebViewAsync();
                WebViewNotice.Visibility = Visibility.Collapsed;
                MainWebView.Visibility = Visibility.Visible;
            }
            else
            {
                //Prompt user to install web view
                WebViewNotice.Visibility = Visibility.Visible;
                MainWebView.Visibility = Visibility.Collapsed;
            }
        }

        async void InitializeWebViewAsync()
        {
            //Wait for initialization
            await MainWebView.EnsureCoreWebView2Async();
            
            //Configure settings
            MainWebView.CoreWebView2.Settings.IsZoomControlEnabled = false;
            
            //Register for incoming events
            MainWebView.CoreWebView2.WebMessageReceived += CoreWebView2OnWebMessageReceived;
            
            //Post connection events
            ConnectionManager.Connected += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageSimple("connect"), JsonOptions));
            ConnectionManager.Disconnected += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageSimple("disconnect"), JsonOptions));
            ConnectionManager.MessageReceived += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageNetwork("message", Convert.ToBase64String(args.Data), args.IsEncrypted), JsonOptions));

            //Capture requests for contact images
            MainWebView.CoreWebView2.AddWebResourceRequestedFilter(Constants.ContactURIPrefix + "*", CoreWebView2WebResourceContext.All);
            MainWebView.CoreWebView2.WebResourceRequested += CoreWebView2OnWebResourceRequested;

            //Map local file directory and load
            MainWebView.CoreWebView2.NewWindowRequested += CoreWebView2OnNewWindowRequested;
            MainWebView.CoreWebView2.SetVirtualHostNameToFolderMapping("windowsweb.airmessage.org", "webassets", CoreWebView2HostResourceAccessKind.Allow);
            MainWebView.Source = new Uri("https://windowsweb.airmessage.org/index.html");
        }

        private async void CoreWebView2OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs args)
        {
            Debug.WriteLine("Received socket message " + args.WebMessageAsJson);
            using var doc = JsonDocument.Parse(args.WebMessageAsJson);

            switch (doc.RootElement.GetProperty("type").GetString()!)
            {
                //Contacts
                case "getContacts":
                {
                    List<JSPersonData> contacts = await JSBridgeContacts.GetContacts();

                    MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageGetContacts("getContacts", contacts), JsonOptions));
                    break;
                }
                case "findContact":
                {
                    string address = doc.RootElement.GetProperty("address").GetString()!;
                    JSContactData? contact = await JSBridgeContacts.FindContact(address);
                    MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageFindContact("findContact", address, contact), JsonOptions));
                    
                    break;
                }

                //Connection
                case "connect":
                {
                    string hostname = doc.RootElement.GetProperty("hostname").GetString()!;
                    int port = doc.RootElement.GetProperty("port").GetInt32();
                    await ConnectionManager.Connect(hostname, port);
                    break;
                }
                case "send":
                {
                    byte[] data = doc.RootElement.GetProperty("data").GetBytesFromBase64();
                    await ConnectionManager.Send(data);
                    break;
                }
                case "disconnect":
                    ConnectionManager.Disconnect();
                    break;
            }
        }

        private async void CoreWebView2OnWebResourceRequested(CoreWebView2 sender, CoreWebView2WebResourceRequestedEventArgs args)
        {
            var uri = new Uri(args.Request.Uri);
            if (uri.Host != "contact.airmessage.org") return;
            
            var contactId = HttpUtility.UrlDecode(uri.PathAndQuery[1..]);
            var deferral = args.GetDeferral();
            try
            {
                var store = await ContactManager.RequestStoreAsync();
                var contact = await store.GetContactAsync(contactId);
                var thumbnail = contact.Thumbnail;
                if (thumbnail != null)
                {
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(await thumbnail.OpenReadAsync(), (int) HttpStatusCode.OK, null, null);
                    args.Response = response;
                    deferral.Complete();
                }
                else
                {
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.NotFound, null, null);
                    args.Response = response;
                    deferral.Complete();
                }
            }
            catch (Exception exception)
            {
                Console.WriteLine(exception.Message);
                    
                var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.InternalServerError, null, null);
                args.Response = response;
                deferral.Complete();
            }
        }

        private static async void CoreWebView2OnNewWindowRequested(CoreWebView2 sender, CoreWebView2NewWindowRequestedEventArgs args)
        {
            args.Handled = true;
            await Launcher.LaunchUriAsync(new Uri(args.Uri));
        }
        
        private async void ButtonWebView2_OnClick(object sender, RoutedEventArgs e)
        {
            await Launcher.LaunchUriAsync(new Uri(@"https://go.microsoft.com/fwlink/p/?LinkId=2124703"));
        }
    }
}
