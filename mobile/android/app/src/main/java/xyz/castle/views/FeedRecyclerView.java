package xyz.castle.views;

import android.app.Activity;
import android.graphics.Rect;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.drawee.generic.RoundingParams;
import com.facebook.drawee.view.SimpleDraweeView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import xyz.castle.ViewUtils;
import xyz.castle.navigation.CastleNavigator;

public class FeedRecyclerView extends RecyclerView {

    private FeedViewAdapter adapter;
    private int screenWidth;
    private String feedName;

    private static class Deck {
        String url;

        Deck(String url) {
            this.url = url;
        }
    }

    private static class DeckRowViewHolder extends RecyclerView.ViewHolder {

        final SimpleDraweeView backgroundImageView;

        public DeckRowViewHolder(@NonNull View itemView) {
            super(itemView);

            backgroundImageView = (SimpleDraweeView) itemView;
        }
    }

    private static String imageUrlForWidth(String url, int width) {
        Uri uri = Uri.parse(url);

        Uri.Builder builder = new Uri.Builder();
        builder.scheme(uri.getScheme())
                .authority(uri.getAuthority())
                .path(uri.getPath());

        for (String queryParameterName : uri.getQueryParameterNames()) {
            if (queryParameterName.equals("w")) {
                builder.appendQueryParameter("w", "" + width);
            } else {
                builder.appendQueryParameter(queryParameterName, uri.getQueryParameter(queryParameterName));
            }
        }

        return builder.build().toString();
    }

    public class FeedViewAdapter extends RecyclerView.Adapter {
        private List<Deck> mDecks;
        private int deckWidth;
        private int deckHeight;
        JSONArray decksJsonArray = new JSONArray();

        public FeedViewAdapter() {
            mDecks = new ArrayList<>();

            int padding = ViewUtils.dpToPx(10);

            deckWidth = (int) Math.floor((screenWidth - padding * 3.0) / 3.0);
            deckHeight = (int) Math.floor(deckWidth * 7.0 / 5.0);
        }

        public void addDecks(JSONArray decks) {
            int startIndex = mDecks.size();

            for (int i = 0; i < decks.length(); i++) {
                try {
                    decksJsonArray.put(decks.getJSONObject(i));
                    String url = decks.getJSONObject(i).getJSONObject("initialCard").getJSONObject("backgroundImage").getString("smallUrl");
                    mDecks.add(new Deck(imageUrlForWidth(url, deckWidth)));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            ViewUtils.runOnUiThread(() -> {
                notifyItemRangeChanged(startIndex, decks.length());
            });
        }

        public void replaceDecks(JSONArray decks) {
            decksJsonArray = decks;
            mDecks = new ArrayList<>();

            for (int i = 0; i < decks.length(); i++) {
                try {
                    String url = decks.getJSONObject(i).getJSONObject("initialCard").getJSONObject("backgroundImage").getString("smallUrl");
                    mDecks.add(new Deck(imageUrlForWidth(url, deckWidth)));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            ViewUtils.runOnUiThread(() -> {
                adapter.notifyDataSetChanged();
            });
        }

        public void setTestDecks() {
            List<String> urls = new ArrayList<>();
            urls.add("https://castle.imgix.net/1ca3e2a09d1718099554fa88b5af512b?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/70f05824f8150dd74d8827789cb5df41?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/b18c0ff207af2d16e296ce602ff35368?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/8312d4fdb63c322ee276b4bee3131fda?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/82431311ea66034ea585ee7b21f4e650?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/a8857cf38b752bff0bd04fb31f1f9109?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/6d2d4306657df3b328a36e98277a76fe?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/9ae64a1ca042ae3885dd8fda920c2d02?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/a92c56c0cccd44f21a5496d4878780d8?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/0142a9c06fbaeb5fd54189d526a77ce3?auto=compress&ar=5:7&fit=crop&w=420");

            mDecks.clear();

            for (int i = 0; i < 200; i++) {
                mDecks.add(new Deck(imageUrlForWidth(urls.get(i % urls.size()), deckWidth)));
            }

            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            SimpleDraweeView view = new SimpleDraweeView(parent.getContext());
            view.getHierarchy().setRoundingParams(RoundingParams.fromCornersRadius(ViewUtils.dpToPx(5)));

            GridLayoutManager.LayoutParams lp = new GridLayoutManager.LayoutParams(deckWidth, deckHeight);
            view.setLayoutParams(lp);

            return new DeckRowViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder untypedHolder, final int position) {
            Deck deck = mDecks.get(position);
            DeckRowViewHolder holder = (DeckRowViewHolder) untypedHolder;

            holder.backgroundImageView.setImageURI(deck.url);
            holder.backgroundImageView.setOnClickListener((View view) -> {
                try {
                    JSONObject playDeckOptions = new JSONObject();

                    playDeckOptions.put("decks", decksJsonArray);
                    playDeckOptions.put("initialDeckIndex", position);
                    playDeckOptions.put("title", feedName);

                    String optionsString = playDeckOptions.toString();

                    ViewUtils.runOnUiThread(() -> {
                        CastleNavigator.castleNavigatorForId("LoggedInRootStack").navigate("PlayDeck", optionsString);
                    });
                } catch (Exception e) {}
            });
        }

        @Override
        public int getItemCount() {
            return mDecks.size();
        }
    }

    public class SpacesItemDecoration extends RecyclerView.ItemDecoration {
        private int space;

        public SpacesItemDecoration(int space) {
            this.space = space;
        }

        @Override
        public void getItemOffsets(Rect outRect, View view,
                                   RecyclerView parent, RecyclerView.State state) {
            /*if (parent.getChildLayoutPosition(view) % 3 == 0) {
                outRect.left = space / 2;
            } else {
                outRect.left = 0;
            }*/

            outRect.left = space / 2;
            outRect.right = space / 2;
            outRect.bottom = space;

            // Add top margin only for the first item to avoid double space between items
            if (parent.getChildLayoutPosition(view) < 3) {
                outRect.top = space;
            } else {
                outRect.top = 0;
            }
        }
    }

    public void addDecks(JSONArray decks) {
        adapter.addDecks(decks);
    }

    public void replaceDecks(JSONArray decks) {
        adapter.replaceDecks(decks);
    }

    public FeedRecyclerView(Activity activity, String feedName) {
        super(activity);

        this.feedName = feedName;
        screenWidth = ViewUtils.screenWidth(activity);

        setHasFixedSize(true);
        setLayoutManager(new GridLayoutManager(getContext(), 3));

        adapter = new FeedViewAdapter();
        //adapter.setTestDecks();

        setAdapter(adapter);
        addItemDecoration(new SpacesItemDecoration(ViewUtils.dpToPx(10)));
/*
        setItemViewCacheSize(20);
        setDrawingCacheEnabled(true);
        setDrawingCacheQuality(View.DRAWING_CACHE_QUALITY_HIGH);*/
    }
}
